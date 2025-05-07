package server

import (
	"encoding/json"
	"fmt"
	"log/slog"
	serverrouter "marketmonkey/actor/server_router"
	serversession "marketmonkey/actor/server_session"
	"libs/golang/actors/common/metrics/metrics"
	"math"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/supabase-community/supabase-go"

	"github.com/anthdm/hollywood/actor"
	"github.com/golang-jwt/jwt/v5"
)

type Server struct {
	ctx        *actor.Context
	listenAddr string
	routerPID  *actor.PID
	quitch     chan struct{}

	metrics *metrics.MetricsServer
}

func New(listenAddr string ) actor.Producer {
	return func() actor.Receiver {
		return &Server{
			listenAddr: listenAddr,
			quitch:     make(chan struct{}),
		}
	}
}

func (s *Server) Receive(c *actor.Context) {
	switch msg := c.Message().(type) {
	case actor.Started:
		err := s.SetupMetrics()
		if err != nil {
			panic(err)
		}

		s.start(c)
		_ = msg

		go func() {
			ticker := time.NewTicker(time.Second * 1)
			for {
				select {
				case <-s.quitch:
					ticker.Stop()
					return
				case <-ticker.C:
					metrics.ReportServerActiveConnectionsCount("open", len(s.ctx.Children())-1)
				}
			}
		}()
	case actor.Stopped:
		close(s.quitch)
	}
}

func (s *Server) SetupMetrics() error {
	metricsServer, err := metrics.NewMetricsServer(metrics.Config{
		Tags:      []string{"server"},
		ServiceID: fmt.Sprintf("server-%s", uuid.New().String()),
	}, s.quitch)
	if err != nil {
		return fmt.Errorf("failed to create metrics server: %w", err)
	}
	s.metrics = metricsServer

	if err := metricsServer.Start(); err != nil {
		return fmt.Errorf("failed to start metrics server: %w", err)
	}

	s.metrics.RegisterAll(metrics.ServerMetrics...)
	return nil
}

func (s *Server) start(ctx *actor.Context) {
	s.routerPID = ctx.SpawnChild(
		serverrouter.New(),
		"router",
		actor.WithMaxRestarts(math.MaxInt),
		actor.WithID("1"),
	)

	e := echo.New()
	e.HideBanner = true
	s.ctx = ctx

	e.GET("/ws", s.handleWS)
	e.POST("/auth", s.handleAuth)

	go func() {
		err := e.Start(s.listenAddr)
		if err != nil {
			slog.Error("failed to start server", "err", err)
			ctx.Engine().Poison(ctx.PID())
		}
		slog.Info("server stopped")
	}()
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  2048,
	WriteBufferSize: 2048,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func (s *Server) handleWS(c echo.Context) error {
	token := c.QueryParam("token")
	useAuth, _ := strconv.ParseBool(os.Getenv("USE_AUTH"))
	if useAuth {
		if _, err := verifySupabaseToken(token, os.Getenv("SUPABASE_JWT_SECRET")); err != nil {
			metrics.ReportServerNewConnection("401")
			return nil
		}
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		metrics.ReportServerNewConnection("500")
		return err
	}

	sessionID := uuid.New()
	s.ctx.SpawnChild(serversession.New(conn, sessionID, s.routerPID, s.dbClient), string(sessionID.String()))
	metrics.ReportServerNewConnection("200")
	return nil
}

type AuthRequest struct {
	Email    string
	Password string
}

type AuthResponse struct {
	Authenticated bool   `json:"authenticated"`
	ErrorMessage  string `json:"errorMessage"`
	Token         string `json:"token"`
}

func (s *Server) handleAuth(c echo.Context) error {
	var authReq AuthRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&authReq); err != nil {
		metrics.ReportServerAuthRequest("400")
		return err
	}
	defer c.Request().Body.Close()

	resp := AuthResponse{}
	useAuth, _ := strconv.ParseBool(os.Getenv("USE_AUTH"))
	if useAuth {
		client, err := supabase.NewClient(os.Getenv("SUPABASE_URL"), os.Getenv("SUPABASE_SECRET"), &supabase.ClientOptions{})
		if err != nil {
			slog.Error("failed to create Supabase client", "err", err.Error())
			resp.ErrorMessage = "Unexpected server error. Please try again later."
			metrics.ReportServerAuthRequest("500")
			return c.JSON(http.StatusInternalServerError, resp)
		}
		if len(authReq.Email) == 0 || len(authReq.Password) == 0 {
			resp.ErrorMessage = "Invalid credentials"
			metrics.ReportServerAuthRequest("401")
			return c.JSON(http.StatusUnauthorized, resp)
		}
		session, err := client.SignInWithEmailPassword(authReq.Email, authReq.Password)
		if err != nil {
			slog.Error("failed to sign in user", "err", err.Error())
			resp.ErrorMessage = "Invalid credentials"
			metrics.ReportServerAuthRequest("401")
			return c.JSON(http.StatusUnauthorized, resp)
		}

		resp.Authenticated = true
		resp.Token = session.AccessToken

		metrics.ReportServerAuthRequest("200")
		return c.JSON(http.StatusOK, resp)
	}

	resp.Token = "lookmorehiddenfootprints"
	resp.Authenticated = true

	metrics.ReportServerAuthRequest("200")
	return c.JSON(http.StatusOK, resp)
}

type CustomClaims struct {
	jwt.RegisteredClaims
	Email        string         `json:"email"`
	Role         string         `json:"role"`
	AppMetadata  map[string]any `json:"app_metadata"`
	UserMetadata map[string]any `json:"user_metadata"`
}

func verifySupabaseToken(tokenString, jwtSecret string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok {
		return nil, fmt.Errorf("failed to extract claims")
	}

	if time.Now().Unix() > claims.ExpiresAt.Unix() {
		return nil, fmt.Errorf("token expired")
	}

	return claims, nil
}
