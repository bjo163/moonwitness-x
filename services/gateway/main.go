package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"
)

type GatewayConfig struct {
	Port         string
	TimeService  string
	AnalyticsUrl string
	RunnerUrl    string
	RadiusUrl    string
	ErpUrl       string
}

type ServiceStatus struct {
	Name      string `json:"name"`
	Language  string `json:"language"`
	Role      string `json:"role"`
	Status    string `json:"status"`
	Endpoint  string `json:"endpoint"`
	LatencyMs int64  `json:"latency_ms,omitempty"`
}

type TopologyResponse struct {
	UniverseName string          `json:"universe_name"`
	Architecture string          `json:"architecture"`
	GatewayTime  string          `json:"gateway_time"`
	Services     []ServiceStatus `json:"services"`
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func main() {
	cfg := GatewayConfig{
		Port:         getEnv("PORT", "5150"),
		TimeService:  getEnv("TIME_SERVICE_URL", "http://127.0.0.1:5155"),
		AnalyticsUrl: getEnv("ANALYTICS_SERVICE_URL", "http://127.0.0.1:5156"),
		RunnerUrl:    getEnv("RUNNER_SERVICE_URL", "http://127.0.0.1:5160"),
		RadiusUrl:    getEnv("RADIUS_SERVICE_URL", "http://127.0.0.1:5170"),
		ErpUrl:       getEnv("ERP_SERVICE_URL", "http://127.0.0.1:5180"),
	}

	timeUrl, err := url.Parse(cfg.TimeService)
	if err != nil {
		log.Fatalf("Invalid TimeService URL: %v", err)
	}
	timeProxy := httputil.NewSingleHostReverseProxy(timeUrl)

	erpUrl, err := url.Parse(cfg.ErpUrl)
	if err != nil {
		log.Fatalf("Invalid ERP URL: %v", err)
	}
	erpProxy := httputil.NewSingleHostReverseProxy(erpUrl)

	analyticsUrl, err := url.Parse(cfg.AnalyticsUrl)
	if err != nil {
		log.Fatalf("Invalid Analytics URL: %v", err)
	}
	analyticsProxy := httputil.NewSingleHostReverseProxy(analyticsUrl)

	runnerUrl, err := url.Parse(cfg.RunnerUrl)
	if err != nil {
		log.Fatalf("Invalid Runner URL: %v", err)
	}
	runnerProxy := httputil.NewSingleHostReverseProxy(runnerUrl)

	radiusUrl, err := url.Parse(cfg.RadiusUrl)
	if err != nil {
		log.Fatalf("Invalid Radius URL: %v", err)
	}
	radiusProxy := httputil.NewSingleHostReverseProxy(radiusUrl)

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"gateway":   "Go Celestial API Gateway v1.0",
		})
	})

	// Architecture & Topology introspection
	mux.HandleFunc("/api/v1/gateway/topology", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		topology := TopologyResponse{
			UniverseName: "Moonwitness Celestial Operating System",
			Architecture: "Polyglot Monorepo (Rust, Go, Python, TypeScript)",
			GatewayTime:  time.Now().UTC().Format(time.RFC3339),
			Services: []ServiceStatus{
				{
					Name:     "mts-kernel",
					Language: "Rust (crates/)",
					Role:     "Mathematical & Astronomical Engine (Antikythera, VSOP87, ELP2000, FLRW, 4 Scriptures)",
					Status:   "Active Kernel",
					Endpoint: "Internal Crate Workspace",
				},
				{
					Name:     "mts-daemon",
					Language: "Rust (services/time)",
					Role:     "Celestial Time Daemon & CelCron Scheduler",
					Status:   "Running",
					Endpoint: cfg.TimeService,
				},
				{
					Name:     "moonwitness-gateway",
					Language: "Go (services/gateway)",
					Role:     "Unified API Gateway & Event Multiplexer",
					Status:   "Running",
					Endpoint: fmt.Sprintf("http://localhost:%s", cfg.Port),
				},
				{
					Name:     "moonwitness-analytics",
					Language: "Python (services/analytics)",
					Role:     "Astrodynamics & Hilal Vision Analytics Engine",
					Status:   "Available",
					Endpoint: cfg.AnalyticsUrl,
				},
				{
					Name:     "moonwitness-web",
					Language: "TypeScript / Next.js 15 (apps/web)",
					Role:     "Celestial OS Web Shell & Telemetry Dashboard",
					Status:   "Active Shell",
					Endpoint: "http://localhost:3000",
				},
				{
					Name:     "moonwitness-runner",
					Language: "Go (services/runner)",
					Role:     "Coolify Engine, Docker Orchestrator & Local Process Supervisor",
					Status:   "Running",
					Endpoint: cfg.RunnerUrl,
				},
				{
					Name:     "moonwitness-radius",
					Language: "Go (services/radius)",
					Role:     "ToughRADIUS AAA, Broadband Gateway & MikroTik Rate Limiter",
					Status:   "Running",
					Endpoint: cfg.RadiusUrl,
				},
				{
					Name:     "moonwitness-erp",
					Language: "Python / FastAPI (services/erp)",
					Role:     "Odoo-like Modular ERP, CRM, Subscription Engine & Transactional Outbox",
					Status:   "Running",
					Endpoint: cfg.ErpUrl,
				},
				{
					Name:     "moonwitness-orm",
					Language: "TypeScript / Prisma (packages/database)",
					Role:     "Celestial ORM & Observation Persistence Layer",
					Status:   "Ready",
					Endpoint: "SQLite / dev.db",
				},
			},
		}

		json.NewEncoder(w).Encode(topology)
	})

	// Proxy to Rust Time Daemon for /api/v1/time/*, /api/v1/cosmic/*, /api/v1/hijri/*
	mux.HandleFunc("/api/v1/time/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Gateway", "Moonwitness-Go-Gateway")
		timeProxy.ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/v1/cosmic", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Gateway", "Moonwitness-Go-Gateway")
		timeProxy.ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/v1/cosmic/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Gateway", "Moonwitness-Go-Gateway")
		timeProxy.ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/v1/hijri/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Gateway", "Moonwitness-Go-Gateway")
		timeProxy.ServeHTTP(w, r)
	})

	// Proxy to Python Analytics Service
	mux.HandleFunc("/api/v1/analytics/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Gateway", "Moonwitness-Go-Gateway")
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/api/v1/gateway")
		analyticsProxy.ServeHTTP(w, r)
	})

	// Proxy to Runner Service (Real Docker & Host Process Engine)
	mux.HandleFunc("/api/v1/runner/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Gateway", "Moonwitness-Go-Gateway")
		runnerProxy.ServeHTTP(w, r)
	})

	// Proxy to RADIUS AAA Service (ToughRADIUS Engine)
	mux.HandleFunc("/api/v1/radius/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Gateway", "Moonwitness-Go-Gateway")
		radiusProxy.ServeHTTP(w, r)
	})

	// Proxy to ERP & Subscription Service (Odoo-like Modular Engine)
	mux.HandleFunc("/api/v1/erp/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Gateway", "Moonwitness-Go-Gateway")
		erpProxy.ServeHTTP(w, r)
	})

	addr := ":" + cfg.Port
	log.Printf("🌌 Moonwitness Celestial API Gateway (Go) listening on %s", addr)
	log.Printf("   ├─ Routing /api/v1/time/*   -> %s (Rust Daemon)", cfg.TimeService)
	log.Printf("   ├─ Routing /api/v1/cosmic/* -> %s (Rust Daemon)", cfg.TimeService)
	log.Printf("   ├─ Routing /api/v1/analytics/* -> %s (Python Analytics)", cfg.AnalyticsUrl)
	log.Printf("   └─ Introspection endpoint: http://localhost:%s/api/v1/gateway/topology", cfg.Port)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Gateway server error: %v", err)
	}
}
