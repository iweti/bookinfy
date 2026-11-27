package httpapi_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/iweti/bookinfy/backend/internal/booking"
	"github.com/iweti/bookinfy/backend/internal/httpapi"
	"github.com/iweti/bookinfy/backend/internal/postgres"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func testStore(t *testing.T) postgres.Store {
	t.Helper()
	url := os.Getenv("BOOKINFY_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("defina BOOKINFY_TEST_DATABASE_URL para testar contra PostgreSQL")
	}
	ctx := context.Background()
	admin, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(admin.Close)
	schema := "bookinfy_test_" + strings.ReplaceAll(time.Now().UTC().Format("20060102_150405.000000000"), ".", "_")
	identifier := pgx.Identifier{schema}.Sanitize()
	if _, err := admin.Exec(ctx, "CREATE SCHEMA "+identifier); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if _, err := admin.Exec(ctx, "DROP SCHEMA "+identifier+" CASCADE"); err != nil {
			t.Error(err)
		}
	})
	config, err := pgxpool.ParseConfig(url)
	if err != nil {
		t.Fatal(err)
	}
	config.ConnConfig.RuntimeParams["search_path"] = schema + ",public"
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	store := postgres.Store{DB: pool}
	if err := store.Migrate(ctx); err != nil {
		t.Fatal(err)
	}
	if err := store.Migrate(ctx); err != nil {
		t.Fatal(err)
	}
	return store
}

func TestBookingConcurrencyAndOwnerIsolation(t *testing.T) {
	store := testStore(t)
	handler := httpapi.New(store, false)
	const password = "local-example-test-password"
	for _, slug := range []string{"aurora", "brisa"} {
		setup := postgres.Setup{
			Business:      booking.Business{Slug: slug, Name: slug, OpensAt: 540, ClosesAt: 720, Weekdays: []int16{0, 1, 2, 3, 4, 5, 6}},
			OwnerEmail:    slug + "@example.com",
			Services:      []postgres.ProvisionService{{Key: "corte", Service: booking.Service{Name: "Corte", Duration: 60, PriceCents: 7000}}},
			Professionals: []postgres.ProvisionProfessional{{Name: "Alex", ServiceKeys: []string{"corte"}}},
		}
		if err := store.Provision(t.Context(), setup, password); err != nil {
			t.Fatal(err)
		}
	}

	send := func(method, path string, value any, cookie *http.Cookie) *httptest.ResponseRecorder {
		var body bytes.Buffer
		if value != nil {
			if err := json.NewEncoder(&body).Encode(value); err != nil {
				t.Error(err)
			}
		}
		request := httptest.NewRequest(method, path, &body)
		if value != nil {
			request.Header.Set("Content-Type", "application/json")
		}
		if cookie != nil {
			request.AddCookie(cookie)
		}
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		return response
	}
	check := func(response *httptest.ResponseRecorder, status int, dest any) {
		t.Helper()
		if response.Code != status {
			t.Fatalf("HTTP %d, esperado %d: %s", response.Code, status, response.Body)
		}
		if dest != nil {
			if err := json.Unmarshal(response.Body.Bytes(), dest); err != nil {
				t.Fatal(err)
			}
		}
	}
	const public = "/v1/public/businesses/"
	var aurora, brisa booking.Catalog
	check(send("GET", public+"aurora", nil, nil), 200, &aurora)
	check(send("GET", public+"brisa", nil, nil), 200, &brisa)
	date := time.Now().In(booking.BusinessLocation).AddDate(0, 0, 1).Format(time.DateOnly)
	request := booking.Request{
		RequestID: "00000000-0000-4000-8000-000000000001",
		ServiceID: aurora.Services[0].ID, ProfessionalID: aurora.Professionals[0].ID,
		Date: date, Time: "09:00", Customer: booking.Customer{Name: "Cliente Aurora", Phone: "11999990001"},
	}
	conflicting := request
	conflicting.RequestID = "00000000-0000-4000-8000-000000000002"
	conflicting.Time = "09:30"
	conflicting.Customer.Phone = "11999990002"
	foreign := request
	foreign.ServiceID = brisa.Services[0].ID
	check(send("POST", public+"aurora/appointments", foreign, nil), 404, nil)

	var first, second *httptest.ResponseRecorder
	var pending sync.WaitGroup
	start := make(chan struct{})
	pending.Add(2)
	go func() {
		defer pending.Done()
		<-start
		first = send("POST", public+"aurora/appointments", request, nil)
	}()
	go func() {
		defer pending.Done()
		<-start
		second = send("POST", public+"aurora/appointments", conflicting, nil)
	}()
	close(start)
	pending.Wait()
	winner, loser, saved := first, second, request
	if second.Code == http.StatusCreated {
		winner, loser, saved = second, first, conflicting
	}
	var confirmed, replay booking.Confirmation
	check(winner, 201, &confirmed)
	check(loser, 409, nil)
	check(send("POST", public+"aurora/appointments", saved, nil), 201, &replay)
	if confirmed.ID == "" || replay.ID != confirmed.ID || replay.Professional != "Alex" || replay.PriceCents != 7000 {
		t.Fatalf("confirmação divergente na repetição: %+v %+v", confirmed, replay)
	}

	var slots []string
	check(send("GET", public+"aurora/slots?service="+saved.ServiceID+"&professional="+saved.ProfessionalID+"&date="+date, nil, nil), 200, &slots)
	if slices.Contains(slots, "09:00") || slices.Contains(slots, "09:30") || !slices.Contains(slots, "11:00") {
		t.Fatalf("disponibilidade após a reserva: %v", slots)
	}

	const agenda = "/v1/owner/businesses/"
	check(send("GET", agenda+"aurora/agenda?date="+date, nil, nil), 401, nil)
	check(send("POST", "/v1/session", map[string]string{"email": "aurora@example.com", "password": "wrong"}, nil), 401, nil)
	login := send("POST", "/v1/session", map[string]string{"email": "aurora@example.com", "password": password}, nil)
	check(login, 200, nil)
	cookies := login.Result().Cookies()
	if len(cookies) != 1 || !cookies[0].HttpOnly || cookies[0].SameSite != http.SameSiteLaxMode {
		t.Fatalf("cookie de sessão inválido")
	}
	cookie := cookies[0]
	var businesses []booking.Business
	check(send("GET", "/v1/session", nil, cookie), 200, &businesses)
	if len(businesses) != 1 || businesses[0].Slug != "aurora" {
		t.Fatalf("negócios vinculados: %+v", businesses)
	}
	check(send("GET", agenda+"brisa/agenda?date="+date, nil, cookie), 404, nil)
	var entries []booking.AgendaItem
	check(send("GET", agenda+"aurora/agenda?date="+date, nil, cookie), 200, &entries)
	if len(entries) != 1 || entries[0].ID != confirmed.ID || entries[0].CustomerName != "Cliente Aurora" {
		t.Fatalf("agenda do dono: %+v", entries)
	}
	check(send("DELETE", "/v1/session", nil, cookie), 200, nil)
	check(send("GET", agenda+"aurora/agenda?date="+date, nil, cookie), 401, nil)
}
