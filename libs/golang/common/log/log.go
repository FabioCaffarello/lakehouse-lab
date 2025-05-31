package log

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

type Level string

const (
	TraceLevel = "trace"
	DebugLevel = "debug"
	InfoLevel  = "info"
	WarnLevel  = "warn"
	ErrorLevel = "error"
	FatalLevel = "fatal"
	PanicLevel = "panic"
)

type Format string

const (
	JSONFormat = "json"
	TextFormat = "text"
)

type key int

const (
	traceIDKey key = iota
)

type Log struct {
	Timestamp string     `json:"timestamp,omitempty"` // This field is already set internally by logrus
	Level     Level      `json:"level,omitempty"`     // This field is already set internally by logrus
	Message   string     `json:"message,omitempty"`   // This field is already set internally by logrus
	TraceId   string     `json:"traceId,omitempty"`
	Id        string     `json:"id,omitempty"`
	Etl       LogEtl     `json:"etl,omitempty"`
	Program   LogProgram `json:"program,omitempty"`
}

type LogEtl struct {
	Source   string `json:"source,omitempty"`
	InputId  string `json:"inputId,omitempty"`
	Method   string `json:"method,omitempty"`
	Entity   string `json:"entity,omitempty"`
	EntityId string `json:"entityId,omitempty"`
	Provider string `json:"provider,omitempty"`
}

type LogProgram struct {
	Name    string `json:"name,omitempty"`
	Version string `json:"version,omitempty"`
}

// Configure will set the standard log at to the provided level and
// will set the format to the provided one.
//
// Returns an error if the given level or format are invalid.
func Configure(l Level, f Format) error {

	if f != "" {
		formatter, err := newFormatter(f)
		if err != nil {
			return fmt.Errorf("error parsing log format: %s", err.Error())
		}
		logrus.SetFormatter(formatter)
	}

	if l != "" {
		level, err := logrus.ParseLevel(string(l))
		if err != nil {
			return fmt.Errorf("error parsing log level: %s", err.Error())
		}
		logrus.SetLevel(level)
	}

	return nil
}

func InitializeLogger(serviceName, version, logLevel, logFormat string) (Log, error) {
	logger := New(serviceName, version)
	err := Configure(Level(logLevel), Format(logFormat))
	if err != nil {
		return Log{}, fmt.Errorf("failed to initialize logger: %v", err)
	}
	return logger, nil
}

func New(name, version string) Log {
	return Log{
		Program: LogProgram{
			Name:    name,
			Version: version,
		},
	}
}

func (l Log) Debug(s string, args ...interface{}) {
	entry := logrus.WithFields(getMap(l))
	entry.Debug(fmt.Sprintf(s, args...))
}

func (l Log) Info(s string, args ...interface{}) {
	entry := logrus.WithFields(getMap(l))
	entry.Info(fmt.Sprintf(s, args...))
}

func (l Log) Error(s string, args ...interface{}) {
	entry := logrus.WithFields(getMap(l))
	entry.Error(fmt.Sprintf(s, args...))
}

func (l Log) Warn(s string, args ...interface{}) {
	entry := logrus.WithFields(getMap(l))
	entry.Warn(fmt.Sprintf(s, args...))
}

func (l Log) TraceID(traceId string) Log {
	l.TraceId = traceId
	return l
}

func (l Log) ID(id string) Log {
	l.Id = id
	return l
}

func (l Log) CreateTraceID() Log {
	l.TraceId = uuid.New().String()
	return l
}

func (l Log) Entity(entity, entityId string) Log {
	l.Etl.Entity = entity
	l.Etl.EntityId = entityId
	return l
}

func (l Log) Source(source, inputId string) Log {
	l.Etl.Source = source
	l.Etl.InputId = inputId
	return l
}

func (l Log) Provider(provider string) Log {
	l.Etl.Provider = provider
	return l
}

func (l Log) Method(method string) Log {
	l.Etl.Method = method
	return l
}

// AddTraceIDToContext adds trace ID to context using the traceIDKey as key.
// If the trace ID doesn't exists, it will be created.
func (l Log) AddTraceIDToContext(ctx context.Context) (Log, context.Context) {
	if l.TraceId == "" {
		logger := l.CreateTraceID()
		return logger, addTraceIDToContext(ctx, logger)
	}
	return l, addTraceIDToContext(ctx, l)
}

// AddTraceIDFromContextToLog adds trace ID from context to log
// using the traceIDKey as key.
//
// If the trace ID doesn't exists, it will return the Log without traceID.
func (l Log) AddTraceIDFromContextToLog(ctx context.Context) Log {
	traceID := ctx.Value(traceIDKey)
	if traceID == nil {
		return l
	}
	value, ok := traceID.(string)
	if !ok {
		return l
	}
	return l.TraceID(value)
}

// GetLogLevel returns current log level
func (l Log) GetLogLevel() Level {
	return Level(logrus.GetLevel().String())
}

func addTraceIDToContext(ctx context.Context, logger Log) context.Context {
	ctx = context.WithValue(ctx, traceIDKey, logger.TraceId)
	return ctx
}

func newFormatter(f Format) (logrus.Formatter, error) {

	defaultFields := logrus.FieldMap{
		logrus.FieldKeyTime:  "timestamp",
		logrus.FieldKeyLevel: "level",
		logrus.FieldKeyMsg:   "message",
	}
	switch f {
	case JSONFormat:
		return &logrus.JSONFormatter{
			FieldMap: defaultFields,
		}, nil
	case TextFormat:
		return &logrus.TextFormatter{
			FieldMap: defaultFields,
		}, nil
	}
	return nil, fmt.Errorf("unknown format[%s]", f)
}

func getMap(l Log) map[string]interface{} {
	inInterface := make(map[string]interface{})
	inInterface["program"] = map[string]interface{}{
		"name":    l.Program.Name,
		"version": l.Program.Version,
	}
	addValue(inInterface, "traceId", l.TraceId)
	addValue(inInterface, "id", l.Id)
	return mapEtl(l, inInterface)
}

func mapEtl(l Log, inInterface map[string]interface{}) map[string]interface{} {
	etl := make(map[string]interface{})
	addValue(etl, "inputId", l.Etl.InputId)
	addValue(etl, "source", l.Etl.Source)
	addValue(etl, "entity", l.Etl.Entity)
	addValue(etl, "entityId", l.Etl.EntityId)
	addValue(etl, "method", l.Etl.Method)
	addValue(etl, "provider", l.Etl.Provider)
	if len(etl) == 0 {
		return inInterface
	}
	inInterface["etl"] = etl
	return inInterface
}

func addValue(mapping map[string]interface{}, fieldName, value string) {
	if value != "" {
		mapping[fieldName] = value
	}
}
