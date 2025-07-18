package typetools

import (
	"fmt"
	"sort"
	"strconv"
	"time"
)

// ToString converts various types to a string representation.
func ToString(data interface{}) (string, error) {
	switch v := data.(type) {
	case map[string]interface{}:
		return MapToString(v)
	case map[string]string:
		return MapToString(v)
	case string:
		return v, nil
	case float64:
		return fmt.Sprintf("%f", v), nil
	case int, int8, int16, int32, int64:
		return strconv.FormatInt(toInt64(v), 10), nil
	case uint, uint8, uint16, uint32, uint64:
		return strconv.FormatUint(toUint64(v), 10), nil
	case bool:
		return strconv.FormatBool(v), nil
	default:
		return "", fmt.Errorf("unsupported type: %T", v)
	}
}

// ToFloat64 converts data to float64.
func ToFloat64(data interface{}) (float64, error) {
	switch v := data.(type) {
	case float64:
		return v, nil
	case string:
		return strconv.ParseFloat(v, 64)
	case int, int8, int16, int32, int64:
		return float64(toInt64(v)), nil
	case uint, uint8, uint16, uint32, uint64:
		return float64(toUint64(v)), nil
	default:
		return 0, fmt.Errorf("unsupported type: %T", v)
	}
}

func MapToString(m interface{}) (string, error) {
	keys := []string{}
	str := ""

	switch v := m.(type) {
	case map[string]interface{}:
		for k := range v {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			if !isSerializable(v[k]) {
				// você pode decidir: ou retornar erro aqui ou string vazia para forçar erro no ToString
				return "", fmt.Errorf("value for key %s is not serializable: %v", k, v[k])
			}
			str += fmt.Sprintf("%s:%v;", k, v[k])
		}
	case map[string]string:
		for k := range v {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			str += fmt.Sprintf("%s:%s;", k, v[k])
		}
	}

	return str, nil
}

func isSerializable(value interface{}) bool {
	switch value.(type) {
	case string, int, int8, int16, int32, int64,
		uint, uint8, uint16, uint32, uint64,
		float32, float64, bool, nil:
		return true
	default:
		return false
	}
}
// MapToString converts a map to a sorted string representation.
// func MapToString(m interface{}) string {
// 	keys := []string{}
// 	str := ""
//
// 	switch v := m.(type) {
// 	case map[string]interface{}:
// 		for k := range v {
// 			keys = append(keys, k)
// 		}
// 		sort.Strings(keys)
// 		for _, k := range keys {
// 			str += fmt.Sprintf("%s:%v;", k, v[k])
// 		}
// 	case map[string]string:
// 		for k := range v {
// 			keys = append(keys, k)
// 		}
// 		sort.Strings(keys)
// 		for _, k := range keys {
// 			str += fmt.Sprintf("%s:%s;", k, v[k])
// 		}
// 	}
//
// 	return str
// }

// ParseDate parses a date string using the given format.
func ParseDate(date, format string) (time.Time, error) {
	return time.Parse(format, date)
}

// ParseBool parses a boolean string.
func ParseBool(data string) (bool, error) {
	return strconv.ParseBool(data)
}

// ParseInt parses an integer string.
func ParseInt(data string) (int, error) {
	return strconv.Atoi(data)
}

// Helper: Convert to int64
func toInt64(i interface{}) int64 {
	switch v := i.(type) {
	case int:
		return int64(v)
	case int8:
		return int64(v)
	case int16:
		return int64(v)
	case int32:
		return int64(v)
	case int64:
		return v
	default:
		return 0
	}
}

// Helper: Convert to uint64
func toUint64(u interface{}) uint64 {
	switch v := u.(type) {
	case uint:
		return uint64(v)
	case uint8:
		return uint64(v)
	case uint16:
		return uint64(v)
	case uint32:
		return uint64(v)
	case uint64:
		return v
	default:
		return 0
	}
}
