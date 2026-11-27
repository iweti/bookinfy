package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/iweti/bookinfy/backend/internal/httpapi"
	"github.com/iweti/bookinfy/backend/internal/postgres"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		slog.Error("Bookinfy", "error", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) != 1 || (args[0] != "serve" && args[0] != "migrate" && args[0] != "provision") {
		return errors.New("uso: bookinfy serve|migrate|provision")
	}
	databaseURL := os.Getenv("BOOKINFY_DATABASE_URL")
	if databaseURL == "" {
		return errors.New("configure BOOKINFY_DATABASE_URL")
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	setupCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(setupCtx, databaseURL)
	if err != nil {
		return errors.New("BOOKINFY_DATABASE_URL inválida")
	}
	defer pool.Close()
	if err := pool.Ping(setupCtx); err != nil {
		return errors.New("não foi possível conectar ao PostgreSQL")
	}
	store := postgres.Store{DB: pool}
	switch args[0] {
	case "migrate":
		return store.Migrate(setupCtx)
	case "provision":
		var data postgres.Setup
		decoder := json.NewDecoder(io.LimitReader(os.Stdin, 1<<20))
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&data); err != nil || decoder.Decode(new(any)) != io.EOF {
			return errors.New("envie a configuração do negócio em JSON pela entrada padrão")
		}
		return store.Provision(setupCtx, data, os.Getenv("BOOKINFY_OWNER_PASSWORD"))
	}

	address := os.Getenv("BOOKINFY_LISTEN_ADDR")
	if address == "" {
		address = "127.0.0.1:8080"
	}
	secureCookie := true
	if value := os.Getenv("BOOKINFY_COOKIE_SECURE"); value != "" {
		secureCookie, err = strconv.ParseBool(value)
		if err != nil {
			return errors.New("BOOKINFY_COOKIE_SECURE deve ser true ou false")
		}
	}
	server := &http.Server{
		Addr: address, Handler: httpapi.New(store, secureCookie),
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second,
		WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second,
	}
	go func() {
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdown); err != nil {
			slog.Error("encerramento HTTP", "error", err)
		}
	}()
	slog.Info("API Bookinfy", "address", address)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("servidor HTTP: %w", err)
	}
	return nil
}
