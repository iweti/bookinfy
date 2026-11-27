package booking

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"slices"
	"strings"
	"time"
	_ "time/tzdata"
	"unicode/utf8"
)

var (
	ErrNotFound      = errors.New("recurso não encontrado")
	ErrInvalid       = errors.New("dados inválidos")
	ErrConflict      = errors.New("horário indisponível")
	BusinessLocation = mustLocation("America/Sao_Paulo")
	UUID             = regexp.MustCompile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
	Slug             = regexp.MustCompile("^[a-z0-9]+(-[a-z0-9]+)*$")
	nonDigits        = regexp.MustCompile("[^0-9]")
)

func mustLocation(name string) *time.Location {
	location, err := time.LoadLocation(name)
	if err != nil {
		panic(err)
	}
	return location
}

type Business struct {
	ID       string  `json:"-"`
	Slug     string  `json:"slug"`
	Name     string  `json:"name"`
	Address  string  `json:"address"`
	City     string  `json:"city"`
	OpensAt  int     `json:"opensAt"`
	ClosesAt int     `json:"closesAt"`
	Weekdays []int16 `json:"weekdays"`
}

type Service struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Duration    int    `json:"duration"`
	PriceCents  int    `json:"priceCents"`
}

type Professional struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Specialty  string   `json:"specialty"`
	ServiceIDs []string `json:"serviceIds"`
}

type Catalog struct {
	Business      Business       `json:"business"`
	Services      []Service      `json:"services"`
	Professionals []Professional `json:"professionals"`
}

type Selection struct {
	Business         Business
	Service          Service
	ProfessionalID   string
	ProfessionalName string
}

type Interval struct {
	Start time.Time
	End   time.Time
}

type Customer struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
	Email string `json:"email"`
}

type Request struct {
	RequestID      string   `json:"requestId"`
	ServiceID      string   `json:"serviceId"`
	ProfessionalID string   `json:"professionalId"`
	Date           string   `json:"date"`
	Time           string   `json:"time"`
	Customer       Customer `json:"customer"`
}

type Confirmation struct {
	ID           string `json:"id"`
	Business     string `json:"business"`
	Service      string `json:"service"`
	Professional string `json:"professional"`
	Date         string `json:"date"`
	Time         string `json:"time"`
	Duration     int    `json:"duration"`
	PriceCents   int    `json:"priceCents"`
}

type AgendaItem struct {
	Confirmation
	CustomerName string `json:"customerName"`
	Status       string `json:"status"`
}

type Store interface {
	Selection(context.Context, string, string, string) (Selection, error)
	Occupied(context.Context, Selection, time.Time, time.Time) ([]Interval, error)
	FindRequest(context.Context, string, string, [32]byte) (Confirmation, error)
	Insert(context.Context, Selection, Request, Interval, [32]byte) (Confirmation, error)
}

type Scheduler struct {
	store Store
	now   func() time.Time
}

func NewScheduler(store Store) Scheduler {
	return Scheduler{store: store, now: time.Now}
}

func Day(value string) (time.Time, error) {
	day, err := time.ParseInLocation(time.DateOnly, value, BusinessLocation)
	if err != nil || day.Year() < 1 {
		return time.Time{}, ErrInvalid
	}
	return day, nil
}

func TimeLabel(minutes int) string {
	return fmt.Sprintf("%02d:%02d", minutes/60, minutes%60)
}

func available(day time.Time, selection Selection, blocks []Interval, now time.Time) []string {
	slots := []string{}
	if !slices.Contains(selection.Business.Weekdays, int16(day.Weekday())) {
		return slots
	}
	for minute := selection.Business.OpensAt; minute+selection.Service.Duration <= selection.Business.ClosesAt; minute += 30 {
		start := day.Add(time.Duration(minute) * time.Minute)
		end := start.Add(time.Duration(selection.Service.Duration) * time.Minute)
		if start.After(now) && !slices.ContainsFunc(blocks, func(block Interval) bool {
			return start.Before(block.End) && end.After(block.Start)
		}) {
			slots = append(slots, TimeLabel(minute))
		}
	}
	return slots
}

func (s Scheduler) Slots(ctx context.Context, slug, serviceID, professionalID, date string) ([]string, error) {
	day, err := Day(date)
	if err != nil || !UUID.MatchString(serviceID) || !UUID.MatchString(professionalID) {
		return nil, ErrInvalid
	}
	selection, err := s.store.Selection(ctx, slug, serviceID, professionalID)
	if err != nil {
		return nil, err
	}
	blocks, err := s.store.Occupied(ctx, selection, day, day.AddDate(0, 0, 1))
	if err != nil {
		return nil, err
	}
	return available(day, selection, blocks, s.now()), nil
}

func (s Scheduler) Reserve(ctx context.Context, slug string, request Request) (Confirmation, error) {
	request.Customer.Name = strings.TrimSpace(request.Customer.Name)
	request.Customer.Phone = nonDigits.ReplaceAllString(request.Customer.Phone, "")
	request.Customer.Email = strings.TrimSpace(request.Customer.Email)
	nameLength := utf8.RuneCountInString(request.Customer.Name)
	phoneLength := len(request.Customer.Phone)
	day, err := Day(request.Date)
	if err != nil || !UUID.MatchString(request.RequestID) || !UUID.MatchString(request.ServiceID) ||
		!UUID.MatchString(request.ProfessionalID) || nameLength < 3 || nameLength > 100 ||
		(phoneLength != 10 && phoneLength != 11) || len(request.Customer.Email) > 150 {
		return Confirmation{}, ErrInvalid
	}
	if request.Customer.Email != "" {
		email, err := mail.ParseAddress(request.Customer.Email)
		if err != nil || email.Address != request.Customer.Email {
			return Confirmation{}, ErrInvalid
		}
	}
	start, err := time.ParseInLocation("2006-01-02 15:04", request.Date+" "+request.Time, BusinessLocation)
	if err != nil || start.Format("15:04") != request.Time {
		return Confirmation{}, ErrInvalid
	}
	selection, err := s.store.Selection(ctx, slug, request.ServiceID, request.ProfessionalID)
	if err != nil {
		return Confirmation{}, err
	}
	payload, err := json.Marshal(request)
	if err != nil {
		return Confirmation{}, err
	}
	hash := sha256.Sum256(payload)
	existing, err := s.store.FindRequest(ctx, selection.Business.ID, request.RequestID, hash)
	if !errors.Is(err, ErrNotFound) {
		return existing, err
	}
	if !slices.Contains(available(day, selection, nil, s.now()), request.Time) {
		return Confirmation{}, ErrConflict
	}
	interval := Interval{Start: start, End: start.Add(time.Duration(selection.Service.Duration) * time.Minute)}
	result, err := s.store.Insert(ctx, selection, request, interval, hash)
	if errors.Is(err, ErrConflict) {
		existing, lookupErr := s.store.FindRequest(ctx, selection.Business.ID, request.RequestID, hash)
		if !errors.Is(lookupErr, ErrNotFound) {
			return existing, lookupErr
		}
	}
	return result, err
}
