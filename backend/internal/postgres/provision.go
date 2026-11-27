package postgres

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"slices"
	"strings"

	"github.com/iweti/bookinfy/backend/internal/auth"
	"github.com/iweti/bookinfy/backend/internal/booking"
	"github.com/jackc/pgx/v5"
)

type ProvisionService struct {
	booking.Service
	Key string `json:"key"`
}

type ProvisionProfessional struct {
	Name        string   `json:"name"`
	Specialty   string   `json:"specialty"`
	ServiceKeys []string `json:"serviceKeys"`
}

type Setup struct {
	Business      booking.Business        `json:"business"`
	OwnerEmail    string                  `json:"ownerEmail"`
	Services      []ProvisionService      `json:"services"`
	Professionals []ProvisionProfessional `json:"professionals"`
}

func (s Store) Provision(ctx context.Context, setup Setup, password string) error {
	b := setup.Business
	email := strings.ToLower(strings.TrimSpace(setup.OwnerEmail))
	address, err := mail.ParseAddress(email)
	if err != nil || address.Address != email || len(email) > 254 || len(password) < 12 || len(password) > 256 {
		return errors.New("informe um e-mail e uma senha de 12 a 256 bytes")
	}
	if !booking.Slug.MatchString(b.Slug) || len(b.Slug) > 63 || strings.TrimSpace(b.Name) == "" ||
		b.OpensAt < 0 || b.ClosesAt >= 1440 || b.ClosesAt <= b.OpensAt || len(b.Weekdays) == 0 ||
		slices.ContainsFunc(b.Weekdays, func(day int16) bool { return day < 0 || day > 6 }) ||
		len(setup.Services) == 0 || len(setup.Professionals) == 0 {
		return errors.New("informe o negócio, expediente, serviços e profissionais")
	}
	salt, passwordHash, err := auth.NewPassword(password)
	if err != nil {
		return err
	}
	return pgx.BeginFunc(ctx, s.DB, func(tx pgx.Tx) error {
		var businessID, userID string
		if err := tx.QueryRow(ctx, `
			INSERT INTO businesses (slug, name, address, city, opens_at, closes_at, weekdays)
			VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
			b.Slug, b.Name, b.Address, b.City, b.OpensAt, b.ClosesAt, b.Weekdays).Scan(&businessID); err != nil {
			return err
		}
		// Preserve credentials when provisioning another business for an existing owner.
		if _, err := tx.Exec(ctx, `
			INSERT INTO users (email, password_salt, password_hash) VALUES ($1, $2, $3)
			ON CONFLICT (email) DO NOTHING`, email, salt, passwordHash); err != nil {
			return err
		}
		var currentSalt, currentHash []byte
		if err := tx.QueryRow(ctx, "SELECT id, password_salt, password_hash FROM users WHERE email = $1", email).
			Scan(&userID, &currentSalt, &currentHash); err != nil {
			return err
		}
		if !auth.VerifyPassword(password, currentSalt, currentHash) {
			return errors.New("a senha informada diverge da conta existente")
		}
		if _, err := tx.Exec(ctx, "INSERT INTO business_memberships (user_id, business_id, role) VALUES ($1, $2, 'owner')",
			userID, businessID); err != nil {
			return err
		}

		services := make(map[string]string, len(setup.Services))
		for _, service := range setup.Services {
			if service.Key == "" || services[service.Key] != "" || strings.TrimSpace(service.Name) == "" ||
				service.Duration < 15 || service.Duration > 480 || service.PriceCents < 0 {
				return fmt.Errorf("serviço inválido ou chave repetida: %q", service.Key)
			}
			var id string
			if err := tx.QueryRow(ctx, `
				INSERT INTO services (business_id, name, description, category, duration_minutes, price_cents)
				VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
				businessID, service.Name, service.Description, service.Category, service.Duration, service.PriceCents).Scan(&id); err != nil {
				return err
			}
			services[service.Key] = id
		}

		for _, professional := range setup.Professionals {
			if strings.TrimSpace(professional.Name) == "" || len(professional.ServiceKeys) == 0 {
				return errors.New("informe nome e serviços de cada profissional")
			}
			var id string
			if err := tx.QueryRow(ctx, "INSERT INTO professionals (business_id, name, specialty) VALUES ($1, $2, $3) RETURNING id",
				businessID, professional.Name, professional.Specialty).Scan(&id); err != nil {
				return err
			}
			for _, key := range professional.ServiceKeys {
				serviceID := services[key]
				if serviceID == "" {
					return fmt.Errorf("serviço desconhecido: %q", key)
				}
				if _, err := tx.Exec(ctx, "INSERT INTO professional_services (business_id, professional_id, service_id) VALUES ($1, $2, $3)",
					businessID, id, serviceID); err != nil {
					return err
				}
			}
		}
		return nil
	})
}
