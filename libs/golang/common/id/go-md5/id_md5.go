package gomd5

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"

	"libs/golang/common/types/type-tools"
)

// ID type definition
type ID string

// NewID generates an ID from various types of data
func NewID(data interface{}) (ID, error) {
	str, err := typetools.ToString(data)
	if err != nil {
		return "", fmt.Errorf("error converting data to string: %w", err)
	}
	return md5Hash(str), nil
}

// md5Hash generates an MD5 hash from a string
func md5Hash(data string) ID {
	hasher := md5.New()
	hasher.Write([]byte(data))
	hash := hasher.Sum(nil)
	return ID(hex.EncodeToString(hash))
}

