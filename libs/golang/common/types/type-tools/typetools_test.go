package typetools

import (
	"testing"
	"time"

	"github.com/stretchr/testify/suite"
)

type TypeToolsSuite struct {
	suite.Suite
}

func TestTypeToolsSuite(t *testing.T) {
	suite.Run(t, new(TypeToolsSuite))
}

// Test ToString function
func (suite *TypeToolsSuite) TestToString() {
	tests := []struct {
		name     string
		input    interface{}
		expected string
		wantErr  bool
	}{
		{"String input", "test", "test", false},
		{"Float64 input", 3.14, "3.140000", false},
		{"Int input", 42, "42", false},
		{"Bool input true", true, "true", false},
		{"Bool input false", false, "false", false},
		{"Unsupported type", struct{}{}, "", true},
		{"Map[string]interface{} input", map[string]interface{}{"key": "value"}, "key:value;", false},
		{"Map[string]string input", map[string]string{"key": "value"}, "key:value;", false},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			got, err := ToString(tt.input)
			if tt.wantErr {
				suite.Error(err, "Expected an error but got nil")
			} else {
				suite.NoError(err, "Expected no error but got one")
				suite.Equal(tt.expected, got, "Expected result did not match")
			}
		})
	}
}

// Test ToFloat64 function
func (suite *TypeToolsSuite) TestToFloat64() {
	tests := []struct {
		name     string
		input    interface{}
		expected float64
		wantErr  bool
	}{
		{"Float64 input", 3.14, 3.14, false},
		{"String input", "3.14", 3.14, false},
		{"Int input", 42, 42.0, false},
		{"Unsupported type", struct{}{}, 0, true},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			got, err := ToFloat64(tt.input)
			if tt.wantErr {
				suite.Error(err, "Expected an error but got nil")
			} else {
				suite.NoError(err, "Expected no error but got one")
				suite.Equal(tt.expected, got, "Expected result did not match")
			}
		})
	}
}

func (suite *TypeToolsSuite) TestMapToString() {
	tests := []struct {
		name     string
		input    interface{}
		expected string
		wantErr  bool
	}{
		{"Map[string]interface{} input", map[string]interface{}{"key": "value"}, "key:value;", false},
		{"Map[string]string input", map[string]string{"key": "value"}, "key:value;", false},
		{"Empty map input", map[string]interface{}{}, "", false},
		{"Invalid map with func", map[string]interface{}{"invalid": func() {}}, "", true},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			got, err := MapToString(tt.input)
			if tt.wantErr {
				suite.Error(err, "Expected an error but got nil")
			} else {
				suite.NoError(err, "Expected no error but got one")
				suite.Equal(tt.expected, got, "Expected result did not match")
			}
		})
	}
}
// Test ParseDate function
func (suite *TypeToolsSuite) TestParseDate() {
	tests := []struct {
		name     string
		date     string
		format   string
		expected time.Time
		wantErr  bool
	}{
		{"Valid date", "2025-01-01", "2006-01-02", time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC), false},
		{"Invalid date", "invalid", "2006-01-02", time.Time{}, true},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			got, err := ParseDate(tt.date, tt.format)
			if tt.wantErr {
				suite.Error(err, "Expected an error but got nil")
			} else {
				suite.NoError(err, "Expected no error but got one")
				suite.True(got.Equal(tt.expected), "Expected time values to be equal")
			}
		})
	}
}

// Test ParseBool function
func (suite *TypeToolsSuite) TestParseBool() {
	tests := []struct {
		name     string
		input    string
		expected bool
		wantErr  bool
	}{
		{"True input", "true", true, false},
		{"False input", "false", false, false},
		{"Invalid input", "invalid", false, true},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			got, err := ParseBool(tt.input)
			if tt.wantErr {
				suite.Error(err, "Expected an error but got nil")
			} else {
				suite.NoError(err, "Expected no error but got one")
				suite.Equal(tt.expected, got, "Expected result did not match")
			}
		})
	}
}

// Test ParseInt function
func (suite *TypeToolsSuite) TestParseInt() {
	tests := []struct {
		name     string
		input    string
		expected int
		wantErr  bool
	}{
		{"Valid int", "42", 42, false},
		{"Invalid int", "invalid", 0, true},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			got, err := ParseInt(tt.input)
			if tt.wantErr {
				suite.Error(err, "Expected an error but got nil")
			} else {
				suite.NoError(err, "Expected no error but got one")
				suite.Equal(tt.expected, got, "Expected result did not match")
			}
		})
	}
}
