package httpapi

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime"
	"net/http"
	"strings"
	"time"

	"github.com/iweti/bookinfy/backend/internal/auth"
	"github.com/iweti/bookinfy/backend/internal/booking"
	"golang.org/x/time/rate"
)

type Store interface {
	booking.Store
	Businesses(context.Context, string) ([]booking.Business, error)
	Catalog(context.Context, string) (booking.Catalog, error)
	Agenda(context.Context, string, string, time.Time) ([]booking.AgendaItem, error)
	UserByEmail(context.Context, string) (auth.Credentials, error)
	CreateSession(context.Context, string, []byte, time.Time, []byte) error
	SessionUser(context.Context, []byte) (string, error)
	DeleteSession(context.Context, []byte) error
}

type handler struct {
	store        Store
	booking      booking.Scheduler
	loginLimit   *rate.Limiter
	secureCookie bool
}

func New(store Store, secureCookie bool) http.Handler {
	h := handler{store: store, booking: booking.NewScheduler(store), loginLimit: rate.NewLimiter(4, 8), secureCookie: secureCookie}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) { write(w, http.StatusOK, map[string]bool{"ok": true}) })
	mux.HandleFunc("GET /v1/public/businesses", h.publicBusinesses)
	mux.HandleFunc("GET /v1/public/businesses/{slug}", h.catalog)
	mux.HandleFunc("GET /v1/public/businesses/{slug}/slots", h.slots)
	mux.HandleFunc("POST /v1/public/businesses/{slug}/appointments", h.reserve)
	mux.HandleFunc("POST /v1/session", h.login)
	mux.HandleFunc("GET /v1/session", h.me)
	mux.HandleFunc("DELETE /v1/session", h.logout)
	mux.HandleFunc("GET /v1/owner/businesses/{slug}/agenda", h.agenda)
	return mux
}

func write(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func fail(w http.ResponseWriter, status int, message string) {
	write(w, status, map[string]string{"error": message})
}

func respond(w http.ResponseWriter, data any, err error, success int) {
	switch {
	case err == nil:
		write(w, success, data)
	case errors.Is(err, booking.ErrInvalid):
		fail(w, http.StatusBadRequest, "Confira os dados informados.")
	case errors.Is(err, booking.ErrNotFound):
		fail(w, http.StatusNotFound, "Recurso não encontrado.")
	case errors.Is(err, booking.ErrConflict):
		fail(w, http.StatusConflict, "Esse horário não está mais disponível. Escolha outro horário.")
	default:
		slog.Error("falha da API", "type", fmt.Sprintf("%T", err))
		fail(w, http.StatusInternalServerError, "Não foi possível concluir a operação.")
	}
}

func decode(w http.ResponseWriter, r *http.Request, data any) bool {
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		fail(w, http.StatusUnsupportedMediaType, "Envie os dados como JSON.")
		return false
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096))
	decoder.DisallowUnknownFields()
	if decoder.Decode(data) != nil || decoder.Decode(new(any)) != io.EOF {
		fail(w, http.StatusBadRequest, "Confira os dados informados.")
		return false
	}
	return true
}

func (h handler) publicBusinesses(w http.ResponseWriter, r *http.Request) {
	result, err := h.store.Businesses(r.Context(), "")
	respond(w, result, err, http.StatusOK)
}

func (h handler) catalog(w http.ResponseWriter, r *http.Request) {
	result, err := h.store.Catalog(r.Context(), r.PathValue("slug"))
	respond(w, result, err, http.StatusOK)
}

func (h handler) slots(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	result, err := h.booking.Slots(r.Context(), r.PathValue("slug"), query.Get("service"), query.Get("professional"), query.Get("date"))
	respond(w, result, err, http.StatusOK)
}

func (h handler) reserve(w http.ResponseWriter, r *http.Request) {
	var request booking.Request
	if !decode(w, r, &request) {
		return
	}
	result, err := h.booking.Reserve(r.Context(), r.PathValue("slug"), request)
	respond(w, result, err, http.StatusCreated)
}

const sessionDuration = 12 * time.Hour

func (h handler) cookie(value string, age int) *http.Cookie {
	return &http.Cookie{
		Name: auth.SessionCookie, Value: value, Path: "/", HttpOnly: true,
		Secure: h.secureCookie, SameSite: http.SameSiteLaxMode, MaxAge: age,
	}
}

func sessionHash(r *http.Request) []byte {
	cookie, err := r.Cookie(auth.SessionCookie)
	if err != nil {
		return nil
	}
	token, err := base64.RawURLEncoding.DecodeString(cookie.Value)
	if err != nil || len(token) != 32 {
		return nil
	}
	hash := sha256.Sum256(token)
	return hash[:]
}

func (h handler) login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &input) {
		return
	}
	if !h.loginLimit.Allow() {
		w.Header().Set("Retry-After", "1")
		fail(w, http.StatusTooManyRequests, "Aguarde um instante e tente novamente.")
		return
	}
	email := strings.ToLower(strings.TrimSpace(input.Email))
	if len(email) > 254 || len(input.Password) > 256 || email == "" || input.Password == "" {
		fail(w, http.StatusUnauthorized, "E-mail ou senha inválidos.")
		return
	}
	user, err := h.store.UserByEmail(r.Context(), email)
	if errors.Is(err, booking.ErrNotFound) {
		auth.VerifyPassword(input.Password, make([]byte, 16), make([]byte, 32))
		fail(w, http.StatusUnauthorized, "E-mail ou senha inválidos.")
		return
	}
	if err != nil {
		respond(w, nil, err, http.StatusOK)
		return
	}
	if !auth.VerifyPassword(input.Password, user.Salt, user.Hash) {
		fail(w, http.StatusUnauthorized, "E-mail ou senha inválidos.")
		return
	}
	var token [32]byte
	if _, err = rand.Read(token[:]); err != nil {
		respond(w, nil, err, http.StatusOK)
		return
	}
	hash := sha256.Sum256(token[:])
	if err := h.store.CreateSession(r.Context(), user.ID, hash[:], time.Now().Add(sessionDuration), sessionHash(r)); err != nil {
		respond(w, nil, err, http.StatusOK)
		return
	}
	http.SetCookie(w, h.cookie(base64.RawURLEncoding.EncodeToString(token[:]), int(sessionDuration/time.Second)))
	write(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h handler) loggedIn(w http.ResponseWriter, r *http.Request) (string, bool) {
	hash := sessionHash(r)
	if hash != nil {
		userID, err := h.store.SessionUser(r.Context(), hash)
		if err == nil {
			return userID, true
		}
		if !errors.Is(err, booking.ErrNotFound) {
			respond(w, nil, err, http.StatusOK)
			return "", false
		}
	}
	fail(w, http.StatusUnauthorized, "Entre para consultar a agenda.")
	return "", false
}

func (h handler) me(w http.ResponseWriter, r *http.Request) {
	if userID, ok := h.loggedIn(w, r); ok {
		businesses, err := h.store.Businesses(r.Context(), userID)
		respond(w, businesses, err, http.StatusOK)
	}
}

func (h handler) logout(w http.ResponseWriter, r *http.Request) {
	if hash := sessionHash(r); hash != nil {
		if err := h.store.DeleteSession(r.Context(), hash); err != nil {
			respond(w, nil, err, http.StatusOK)
			return
		}
	}
	http.SetCookie(w, h.cookie("", -1))
	write(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h handler) agenda(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.loggedIn(w, r)
	if !ok {
		return
	}
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().In(booking.BusinessLocation).Format(time.DateOnly)
	}
	day, err := booking.Day(date)
	if err != nil {
		respond(w, nil, err, http.StatusOK)
		return
	}
	result, err := h.store.Agenda(r.Context(), userID, r.PathValue("slug"), day)
	respond(w, result, err, http.StatusOK)
}
