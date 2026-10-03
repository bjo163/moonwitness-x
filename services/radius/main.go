package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

type ApiServer struct {
	httpPort int
	store    *RadiusStore
	radSrv   *RadiusServer
}

func getEnvInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return defaultVal
}

func main() {
	httpPort := getEnvInt("RADIUS_HTTP_PORT", 5170)
	authPort := getEnvInt("RADIUS_AUTH_PORT", 1812)
	acctPort := getEnvInt("RADIUS_ACCT_PORT", 1813)

	store := NewRadiusStore()
	radSrv := NewRadiusServer(authPort, acctPort, store)

	// Launch UDP RADIUS Server (1812 & 1813)
	if err := radSrv.Start(); err != nil {
		log.Printf("⚠️ Radius UDP server start warning: %v", err)
	}

	api := &ApiServer{
		httpPort: httpPort,
		store:    store,
		radSrv:   radSrv,
	}

	mux := http.NewServeMux()

	cors := func(h http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			h(w, r)
		}
	}

	// 1. Health
	mux.HandleFunc("/healthz", cors(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"service":   "Moonwitness ToughRADIUS Engine v1.0",
		})
	}))

	// 2. Overview Telemetry
	mux.HandleFunc("/api/v1/radius/overview", cors(api.handleOverview))

	// 3. Online Sessions
	mux.HandleFunc("/api/v1/radius/sessions", cors(api.handleSessions))
	mux.HandleFunc("/api/v1/radius/sessions/disconnect", cors(api.handleDisconnect))

	// 4. Subscribers
	mux.HandleFunc("/api/v1/radius/subscribers", cors(api.handleSubscribers))

	// 5. Rate Profiles
	mux.HandleFunc("/api/v1/radius/profiles", cors(api.handleProfiles))

	// 6. NAS Routers
	mux.HandleFunc("/api/v1/radius/nas", cors(api.handleNas))

	// 7. Vouchers
	mux.HandleFunc("/api/v1/radius/vouchers/generate", cors(api.handleGenerateVouchers))

	// 8. Test Auth
	mux.HandleFunc("/api/v1/radius/test-auth", cors(api.handleTestAuth))

	addr := fmt.Sprintf(":%d", httpPort)
	log.Printf("🌐 Moonwitness RADIUS REST API & Management listening on %s", addr)
	log.Printf("   ├─ RADIUS Authentication (UDP): :%d", authPort)
	log.Printf("   ├─ RADIUS Accounting (UDP):     :%d", acctPort)
	log.Printf("   ├─ CoA / PoD Disconnect (UDP):  :3799")
	log.Printf("   └─ REST Management API:         http://localhost%s/api/v1/radius/overview", addr)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Radius API server error: %v", err)
	}
}

func (api *ApiServer) handleOverview(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	api.store.mu.RLock()
	defer api.store.mu.RUnlock()

	var totalUpload int64
	var totalDownload int64
	for _, s := range api.store.sessions {
		totalUpload += s.InputBytes
		totalDownload += s.OutputBytes
	}

	res := map[string]interface{}{
		"activeSessions":    len(api.store.sessions),
		"totalSubscribers":  len(api.store.subscribers),
		"totalNas":          len(api.store.nasList),
		"totalProfiles":     len(api.store.profiles),
		"totalUploadMb":     totalUpload / (1024 * 1024),
		"totalDownloadMb":   totalDownload / (1024 * 1024),
		"authRequestsTotal": api.store.authRequests,
		"authAcceptsTotal":  api.store.authAccepts,
		"authRejectsTotal":  api.store.authRejects,
		"acctRequestsTotal": api.store.acctRequests,
		"serverUptime":      time.Since(api.store.startTime).Round(time.Second).String(),
		"engine":            "ToughRADIUS Go Engine (RFC 2865 / 2866)",
	}
	json.NewEncoder(w).Encode(res)
}

func (api *ApiServer) handleSessions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	api.store.mu.RLock()
	var sessions []OnlineSession
	for _, s := range api.store.sessions {
		sessions = append(sessions, s)
	}
	api.store.mu.RUnlock()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"sessions": sessions,
		"total":    len(sessions),
	})
}

func (api *ApiServer) handleDisconnect(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		SessionID string `json:"sessionId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SessionID == "" {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	api.store.mu.RLock()
	sess, exists := api.store.sessions[req.SessionID]
	api.store.mu.RUnlock()

	if !exists {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}

	// Send PoD packet
	err := api.radSrv.DisconnectSession(sess)
	if err != nil {
		log.Printf("PoD warning: %v", err)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"sessionId": req.SessionID,
		"user":      sess.Username,
		"message":   "Packet of Disconnect (PoD) transmitted to NAS",
	})
}

func (api *ApiServer) handleSubscribers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodGet {
		api.store.mu.RLock()
		var subs []Subscriber
		for _, s := range api.store.subscribers {
			subs = append(subs, s)
		}
		api.store.mu.RUnlock()
		json.NewEncoder(w).Encode(map[string]interface{}{"subscribers": subs})
		return
	}

	if r.Method == http.MethodPost {
		var sub Subscriber
		if err := json.NewDecoder(r.Body).Decode(&sub); err != nil || sub.Username == "" {
			http.Error(w, "invalid subscriber payload", http.StatusBadRequest)
			return
		}

		if sub.ID == "" {
			sub.ID = fmt.Sprintf("sub-%d", time.Now().UnixNano()%100000)
		}
		if sub.Status == "" {
			sub.Status = "active"
		}
		if sub.CreatedAt == "" {
			sub.CreatedAt = time.Now().Format(time.RFC3339)
		}

		api.store.mu.Lock()
		api.store.subscribers[sub.Username] = sub
		api.store.mu.Unlock()

		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "subscriber": sub})
		return
	}

	if r.Method == http.MethodDelete {
		username := r.URL.Query().Get("username")
		if username == "" {
			http.Error(w, "missing username param", http.StatusBadRequest)
			return
		}

		api.store.mu.Lock()
		delete(api.store.subscribers, username)
		api.store.mu.Unlock()

		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "deleted": username})
		return
	}
}

func (api *ApiServer) handleProfiles(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodGet {
		api.store.mu.RLock()
		var profs []RateProfile
		for _, p := range api.store.profiles {
			profs = append(profs, p)
		}
		api.store.mu.RUnlock()
		json.NewEncoder(w).Encode(map[string]interface{}{"profiles": profs})
		return
	}

	if r.Method == http.MethodPost {
		var prof RateProfile
		if err := json.NewDecoder(r.Body).Decode(&prof); err != nil || prof.Name == "" {
			http.Error(w, "invalid profile payload", http.StatusBadRequest)
			return
		}

		if prof.ID == "" {
			prof.ID = fmt.Sprintf("prof-%d", time.Now().Unix()%10000)
		}

		api.store.mu.Lock()
		api.store.profiles[prof.ID] = prof
		api.store.mu.Unlock()

		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "profile": prof})
		return
	}
}

func (api *ApiServer) handleNas(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodGet {
		api.store.mu.RLock()
		var list []Nas
		for _, n := range api.store.nasList {
			list = append(list, n)
		}
		api.store.mu.RUnlock()
		json.NewEncoder(w).Encode(map[string]interface{}{"nasList": list})
		return
	}

	if r.Method == http.MethodPost {
		var n Nas
		if err := json.NewDecoder(r.Body).Decode(&n); err != nil || n.IPAddr == "" {
			http.Error(w, "invalid nas payload", http.StatusBadRequest)
			return
		}

		if n.ID == "" {
			n.ID = fmt.Sprintf("nas-%d", time.Now().Unix()%10000)
		}
		if n.CoAPort == 0 {
			n.CoAPort = 3799
		}
		if n.Vendor == "" {
			n.Vendor = "MikroTik"
		}
		n.CreatedAt = time.Now().Format(time.RFC3339)

		api.store.mu.Lock()
		api.store.nasList[n.IPAddr] = n
		api.store.mu.Unlock()

		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "nas": n})
		return
	}
}

func (api *ApiServer) handleGenerateVouchers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Count     int    `json:"count"`
		Prefix    string `json:"prefix"`
		ProfileID string `json:"profileId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}
	if req.Count <= 0 {
		req.Count = 5
	}
	if req.ProfileID == "" {
		req.ProfileID = "prof-voucher-24h"
	}

	vouchers := api.store.BatchGenerateVouchers(req.Count, req.Prefix, req.ProfileID)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"count":    len(vouchers),
		"vouchers": vouchers,
	})
}

func (api *ApiServer) handleTestAuth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		NasIP    string `json:"nasIp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" {
		http.Error(w, "invalid credentials", http.StatusBadRequest)
		return
	}
	if req.NasIP == "" {
		req.NasIP = "127.0.0.1"
	}

	res, err := api.radSrv.SimulateTestAuth(req.Username, req.Password, req.NasIP)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(res)
}
