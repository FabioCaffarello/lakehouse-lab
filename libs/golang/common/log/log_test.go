package log_test

import (
	"context"
	"testing"

	"github.com/sirupsen/logrus"
	"libs/golang/common/log"
)

func TestConfigure(t *testing.T) {
	serviceName := "test"
	serviceVersion := "0.1"

	log.New(serviceName, serviceVersion)

	level := log.DebugLevel
	format := log.Format(log.JSONFormat)
	err := log.Configure(log.Level(level), format)
	if err != nil {
		t.Errorf("Expected nil error, got: %s", err.Error())
	}

	if !logrus.IsLevelEnabled(logrus.DebugLevel) {
		t.Errorf("Expected level: %s", level)
	}
}

func TestConfigureLevelError(t *testing.T) {
	serviceName := "test"
	serviceVersion := "0.1"

	log.New(serviceName, serviceVersion)

	level := "wrong-level"
	format := log.Format(log.JSONFormat)
	err := log.Configure(log.Level(level), format)

	if err == nil {
		t.Error("Expected not nil error")
	}
}

func TestConfigureFormatError(t *testing.T) {
	serviceName := "test"
	serviceVersion := "0.1"

	log.New(serviceName, serviceVersion)

	level := log.DebugLevel
	format := log.Format("wrong-format")
	err := log.Configure(log.Level(level), format)

	if err == nil {
		t.Error("Expected not nil error")
	}
}

func TestAddTraceIDMethodsWithoutTraceID(t *testing.T) {
	serviceName := "test"
	serviceVersion := "0.1"

	l := log.New(serviceName, serviceVersion)
	l, ctx := l.AddTraceIDToContext(context.Background())
	logger := l.AddTraceIDFromContextToLog(ctx)

	if logger.TraceId == "" {
		t.Error("Expected not nit error")
	}
}

func TestAddTraceIDMethodsWithTraceID(t *testing.T) {
	serviceName := "test"
	serviceVersion := "0.1"

	l := log.New(serviceName, serviceVersion)
	l = l.CreateTraceID()
	traceIDExpected := l.TraceId
	l, ctx := l.AddTraceIDToContext(context.Background())
	l2 := log.New(serviceName, serviceVersion)
	logger := l2.AddTraceIDFromContextToLog(ctx)

	if logger.TraceId != traceIDExpected {
		t.Error("Should be equal")
	}
}

func TestAddTraceIDFromContextWithoutTraceIDOnContext(t *testing.T) {
	serviceName := "test"
	serviceVersion := "0.1"

	l := log.New(serviceName, serviceVersion)
	logger := l.AddTraceIDFromContextToLog(context.Background())

	if logger.TraceId != "" {
		t.Errorf("Should be empty, it is %v", logger.TraceId)
	}
}

func TestGetLogLevel(t *testing.T) {
	serviceName := "test"
	serviceVersion := "0.1"

	l := log.New(serviceName, serviceVersion)

	level := log.DebugLevel
	err := log.Configure(log.Level(level), log.JSONFormat)
	if err != nil {
		t.Error("Error not expected", err)
	}

	currentLevel := l.GetLogLevel()

	if currentLevel != log.DebugLevel {
		t.Error("log level not expected:", currentLevel)
	}
}
