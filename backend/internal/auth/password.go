package auth

import (
	"crypto/rand"
	"crypto/subtle"

	"golang.org/x/crypto/argon2"
)

type Credentials struct {
	ID   string
	Salt []byte
	Hash []byte
}

const SessionCookie = "bookinfy_session"

func hash(password string, salt []byte) []byte {
	return argon2.IDKey([]byte(password), salt, 2, 19*1024, 1, 32)
}

func NewPassword(password string) ([]byte, []byte, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return nil, nil, err
	}
	return salt, hash(password, salt), nil
}

func VerifyPassword(password string, salt, expected []byte) bool {
	return subtle.ConstantTimeCompare(hash(password, salt), expected) == 1
}
