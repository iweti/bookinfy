package postgres

import (
	"bytes"
	"context"
	_ "embed"
	"errors"
	"time"

	"github.com/iweti/bookinfy/backend/internal/auth"
	"github.com/iweti/bookinfy/backend/internal/booking"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed 001_initial.sql
var initialSchema string

type Store struct {
	DB *pgxpool.Pool
}

type rowScanner interface {
	Scan(...any) error
}

func (s Store) Migrate(ctx context.Context) error {
	return pgx.BeginFunc(ctx, s.DB, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock(674108025)"); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, "CREATE TABLE IF NOT EXISTS bookinfy_migrations (version integer PRIMARY KEY)"); err != nil {
			return err
		}
		var applied bool
		if err := tx.QueryRow(ctx, "SELECT EXISTS (SELECT FROM bookinfy_migrations WHERE version = 1)").Scan(&applied); err != nil || applied {
			return err
		}
		if _, err := tx.Exec(ctx, initialSchema); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, "INSERT INTO bookinfy_migrations (version) VALUES (1)")
		return err
	})
}

const businessFields = "b.id, b.slug, b.name, b.address, b.city, b.opens_at, b.closes_at, b.weekdays"

func scanBusiness(row rowScanner) (booking.Business, error) {
	var b booking.Business
	err := row.Scan(&b.ID, &b.Slug, &b.Name, &b.Address, &b.City, &b.OpensAt, &b.ClosesAt, &b.Weekdays)
	return b, notFound(err)
}

func notFound(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return booking.ErrNotFound
	}
	return err
}

func (s Store) Businesses(ctx context.Context, userID string) ([]booking.Business, error) {
	query := "SELECT " + businessFields + " FROM businesses b ORDER BY b.name, b.slug"
	var args []any
	if userID != "" {
		query = "SELECT " + businessFields + " FROM businesses b JOIN business_memberships m ON m.business_id = b.id WHERE m.user_id = $1 AND m.role = 'owner' ORDER BY b.name, b.slug"
		args = append(args, userID)
	}
	rows, err := s.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []booking.Business{}
	for rows.Next() {
		business, err := scanBusiness(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, business)
	}
	return result, rows.Err()
}

func (s Store) Catalog(ctx context.Context, slug string) (booking.Catalog, error) {
	business, err := scanBusiness(s.DB.QueryRow(ctx, "SELECT "+businessFields+" FROM businesses b WHERE b.slug = $1", slug))
	if err != nil {
		return booking.Catalog{}, err
	}
	services, err := s.DB.Query(ctx, `
		SELECT id, name, description, category, duration_minutes, price_cents FROM services
		WHERE business_id = $1 ORDER BY name, id`, business.ID)
	if err != nil {
		return booking.Catalog{}, err
	}
	serviceList, err := pgx.CollectRows(services, func(row pgx.CollectableRow) (booking.Service, error) {
		var value booking.Service
		err := row.Scan(&value.ID, &value.Name, &value.Description, &value.Category, &value.Duration, &value.PriceCents)
		return value, err
	})
	if err != nil {
		return booking.Catalog{}, err
	}
	professionals, err := s.DB.Query(ctx, `
		SELECT p.id, p.name, p.specialty, array_agg(ps.service_id::text ORDER BY ps.service_id)
		FROM professionals p
		JOIN professional_services ps ON ps.business_id = p.business_id AND ps.professional_id = p.id
		WHERE p.business_id = $1 GROUP BY p.id, p.name, p.specialty ORDER BY p.name, p.id`, business.ID)
	if err != nil {
		return booking.Catalog{}, err
	}
	professionalList, err := pgx.CollectRows(professionals, func(row pgx.CollectableRow) (booking.Professional, error) {
		var value booking.Professional
		err := row.Scan(&value.ID, &value.Name, &value.Specialty, &value.ServiceIDs)
		return value, err
	})
	return booking.Catalog{Business: business, Services: serviceList, Professionals: professionalList}, err
}

func (s Store) Selection(ctx context.Context, slug, serviceID, professionalID string) (booking.Selection, error) {
	var result booking.Selection
	b := &result.Business
	service := &result.Service
	err := s.DB.QueryRow(ctx, `
		SELECT `+businessFields+`, sv.id, sv.name, sv.duration_minutes, sv.price_cents, p.id, p.name
		FROM businesses b
		JOIN professional_services ps ON ps.business_id = b.id
		JOIN professionals p ON p.business_id = ps.business_id AND p.id = ps.professional_id
		JOIN services sv ON sv.business_id = ps.business_id AND sv.id = ps.service_id
		WHERE b.slug = $1 AND sv.id = $2 AND p.id = $3`, slug, serviceID, professionalID).
		Scan(&b.ID, &b.Slug, &b.Name, &b.Address, &b.City, &b.OpensAt, &b.ClosesAt, &b.Weekdays,
			&service.ID, &service.Name, &service.Duration, &service.PriceCents, &result.ProfessionalID, &result.ProfessionalName)
	return result, notFound(err)
}

func (s Store) Occupied(ctx context.Context, selection booking.Selection, from, until time.Time) ([]booking.Interval, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT starts_at, ends_at FROM appointments
		WHERE business_id = $1 AND professional_id = $2 AND starts_at < $4 AND ends_at > $3
		  AND status IN ('scheduled', 'confirmed', 'in_progress', 'completed')`,
		selection.Business.ID, selection.ProfessionalID, from, until)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (booking.Interval, error) {
		var interval booking.Interval
		err := row.Scan(&interval.Start, &interval.End)
		return interval, err
	})
}

const appointmentJoins = `
	FROM appointments a
	JOIN businesses b ON b.id = a.business_id
	JOIN services sv ON sv.business_id = a.business_id AND sv.id = a.service_id
	JOIN professionals p ON p.business_id = a.business_id AND p.id = a.professional_id`

const confirmationFields = "a.id, b.name, sv.name, p.name, a.starts_at, a.ends_at, a.price_cents"

func scanConfirmation(row rowScanner, result *booking.Confirmation, fields ...any) error {
	var start, end time.Time
	args := []any{&result.ID, &result.Business, &result.Service, &result.Professional, &start, &end, &result.PriceCents}
	if err := row.Scan(append(args, fields...)...); err != nil {
		return notFound(err)
	}
	local := start.In(booking.BusinessLocation)
	result.Date = local.Format(time.DateOnly)
	result.Time = local.Format("15:04")
	result.Duration = int(end.Sub(start).Minutes())
	return nil
}

func (s Store) FindRequest(ctx context.Context, businessID, requestID string, hash [32]byte) (booking.Confirmation, error) {
	var result booking.Confirmation
	var savedHash []byte
	err := scanConfirmation(s.DB.QueryRow(ctx, "SELECT "+confirmationFields+", a.request_hash "+appointmentJoins+
		" WHERE a.business_id = $1 AND a.request_id = $2", businessID, requestID), &result, &savedHash)
	if err == nil && !bytes.Equal(hash[:], savedHash) {
		return booking.Confirmation{}, booking.ErrConflict
	}
	return result, err
}

func (s Store) Insert(ctx context.Context, selection booking.Selection, request booking.Request, interval booking.Interval, hash [32]byte) (booking.Confirmation, error) {
	var id string
	err := s.DB.QueryRow(ctx, `
		WITH customer AS (
			INSERT INTO customers (business_id, name, phone, email) VALUES ($1, $2, $3, $4)
			ON CONFLICT (business_id, phone) DO UPDATE SET phone = EXCLUDED.phone
			RETURNING id
		)
		INSERT INTO appointments (
			business_id, customer_name, customer_id, service_id, professional_id, price_cents,
			starts_at, ends_at, request_id, request_hash
		)
		SELECT $1, $2, id, $5, $6, $7, $8, $9, $10, $11 FROM customer
		RETURNING id`,
		selection.Business.ID, request.Customer.Name, request.Customer.Phone, request.Customer.Email,
		selection.Service.ID, selection.ProfessionalID, selection.Service.PriceCents,
		interval.Start, interval.End, request.RequestID, hash[:]).Scan(&id)
	if err != nil {
		var databaseError *pgconn.PgError
		if errors.As(err, &databaseError) && (databaseError.Code == "23P01" || databaseError.Code == "23505") {
			return booking.Confirmation{}, booking.ErrConflict
		}
		return booking.Confirmation{}, err
	}
	return booking.Confirmation{
		ID: id, Business: selection.Business.Name, Service: selection.Service.Name,
		Date: request.Date, Time: request.Time, Duration: selection.Service.Duration,
		PriceCents:   selection.Service.PriceCents,
		Professional: selection.ProfessionalName,
	}, nil
}

func (s Store) Agenda(ctx context.Context, userID, slug string, day time.Time) ([]booking.AgendaItem, error) {
	var businessID string
	err := s.DB.QueryRow(ctx, `
		SELECT b.id FROM businesses b JOIN business_memberships m ON m.business_id = b.id
		WHERE b.slug = $1 AND m.user_id = $2 AND m.role = 'owner'`, slug, userID).Scan(&businessID)
	if err != nil {
		return nil, notFound(err)
	}
	rows, err := s.DB.Query(ctx, "SELECT "+confirmationFields+", a.customer_name, a.status "+appointmentJoins+`
		JOIN business_memberships m ON m.business_id = a.business_id AND m.user_id = $2 AND m.role = 'owner'
		WHERE a.business_id = $1 AND a.starts_at >= $3 AND a.starts_at < $4
		ORDER BY a.starts_at, p.name, a.id`, businessID, userID, day, day.AddDate(0, 0, 1))
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (booking.AgendaItem, error) {
		var item booking.AgendaItem
		err := scanConfirmation(row, &item.Confirmation, &item.CustomerName, &item.Status)
		return item, err
	})
}

func (s Store) UserByEmail(ctx context.Context, email string) (auth.Credentials, error) {
	var user auth.Credentials
	err := s.DB.QueryRow(ctx, "SELECT id, password_salt, password_hash FROM users WHERE email = $1", email).
		Scan(&user.ID, &user.Salt, &user.Hash)
	return user, notFound(err)
}

func (s Store) CreateSession(ctx context.Context, userID string, tokenHash []byte, expiry time.Time, previous []byte) error {
	_, err := s.DB.Exec(ctx, `
		WITH revoked AS (
			DELETE FROM sessions WHERE token_hash = $4 OR (user_id = $1 AND expires_at <= now())
		)
		INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, userID, tokenHash, expiry, previous)
	return err
}

func (s Store) SessionUser(ctx context.Context, tokenHash []byte) (string, error) {
	var id string
	err := s.DB.QueryRow(ctx, "SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > now()", tokenHash).Scan(&id)
	return id, notFound(err)
}

func (s Store) DeleteSession(ctx context.Context, tokenHash []byte) error {
	_, err := s.DB.Exec(ctx, "DELETE FROM sessions WHERE token_hash = $1", tokenHash)
	return err
}
