package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"
)

// Nas represents a Network Access Server (e.g. MikroTik Router, Cisco, Linux BRAS)
type Nas struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	IPAddr      string `json:"ipAddr"`
	Secret      string `json:"secret"`
	Vendor      string `json:"vendor"`  // "MikroTik", "Cisco", "Standard"
	CoAPort     int    `json:"coaPort"` // Default: 3799
	Description string `json:"description"`
	CreatedAt   string `json:"createdAt"`
}

// RateProfile represents a bandwidth and billing plan (ToughRADIUS style)
type RateProfile struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	RateLimit    string  `json:"rateLimit"` // e.g. "10M/10M" or "10240k/30720k"
	Price        float64 `json:"price"`
	QuotaMB      int64   `json:"quotaMb"` // 0 = unlimited
	DurationDays int     `json:"durationDays"`
	Description  string  `json:"description"`
}

// Subscriber represents a broadband PPPoE user or Hotspot voucher
type Subscriber struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	ProfileID string `json:"profileId"`
	Status    string `json:"status"` // "active", "disabled", "expired"
	ExpireAt  string `json:"expireAt"`
	QuotaMB   int64  `json:"quotaMb"`
	UsedMB    int64  `json:"usedMb"`
	MACAddr   string `json:"macAddr,omitempty"`
	FramedIP  string `json:"framedIp,omitempty"`
	CreatedAt string `json:"createdAt"`
}

// OnlineSession represents an active connection reported by MikroTik via RADIUS Accounting
type OnlineSession struct {
	SessionID   string `json:"sessionId"`
	Username    string `json:"username"`
	NasIP       string `json:"nasIp"`
	FramedIP    string `json:"framedIp"`
	MACAddr     string `json:"macAddr"`
	StartTime   string `json:"startTime"`
	LastUpdate  string `json:"lastUpdate"`
	InputBytes  int64  `json:"inputBytes"`  // Upload
	OutputBytes int64  `json:"outputBytes"` // Download
	RateLimit   string `json:"rateLimit"`
	NasPort     uint32 `json:"nasPort"`
}

// RadiusStore manages in-memory thread-safe state
type RadiusStore struct {
	mu           sync.RWMutex
	nasList      map[string]Nas           // Key: IP
	profiles     map[string]RateProfile   // Key: ID
	subscribers  map[string]Subscriber    // Key: Username
	sessions     map[string]OnlineSession // Key: SessionID
	authRequests int64
	authAccepts  int64
	authRejects  int64
	acctRequests int64
	startTime    time.Time
}

func NewRadiusStore() *RadiusStore {
	store := &RadiusStore{
		nasList:     make(map[string]Nas),
		profiles:    make(map[string]RateProfile),
		subscribers: make(map[string]Subscriber),
		sessions:    make(map[string]OnlineSession),
		startTime:   time.Now(),
	}

	// Seed realistic ToughRADIUS default configuration
	store.seedInitialData()
	return store
}

func (s *RadiusStore) seedInitialData() {
	// 1. NAS Routers
	s.nasList["127.0.0.1"] = Nas{
		ID:          "nas-loopback",
		Name:        "MikroTik Lab Core (Localhost)",
		IPAddr:      "127.0.0.1",
		Secret:      "testing123",
		Vendor:      "MikroTik",
		CoAPort:     3799,
		Description: "Local Development Router",
		CreatedAt:   time.Now().Format(time.RFC3339),
	}
	s.nasList["192.168.88.1"] = Nas{
		ID:          "nas-mikrotik-gw",
		Name:        "MikroTik CCR2004 Gateway",
		IPAddr:      "192.168.88.1",
		Secret:      "moonwitness-radius-secret",
		Vendor:      "MikroTik",
		CoAPort:     3799,
		Description: "Primary FTTH / PPPoE Concentrator",
		CreatedAt:   time.Now().Format(time.RFC3339),
	}

	// 2. Rate Profiles
	s.profiles["prof-home-10m"] = RateProfile{
		ID:           "prof-home-10m",
		Name:         "Home Basic 10M",
		RateLimit:    "10M/10M",
		Price:        150000,
		QuotaMB:      0, // Unlimited
		DurationDays: 30,
		Description:  "Symmetrical 10 Mbps Unlimited PPPoE",
	}
	s.profiles["prof-ultra-50m"] = RateProfile{
		ID:           "prof-ultra-50m",
		Name:         "Ultra Stream 50M",
		RateLimit:    "50M/50M",
		Price:        350000,
		QuotaMB:      500000, // 500GB FUP
		DurationDays: 30,
		Description:  "High-speed 50 Mbps with 500GB FUP",
	}
	s.profiles["prof-voucher-24h"] = RateProfile{
		ID:           "prof-voucher-24h",
		Name:         "Hotspot Voucher 24 Jam",
		RateLimit:    "5M/5M",
		Price:        10000,
		QuotaMB:      5000, // 5GB
		DurationDays: 1,
		Description:  "Hotspot voucher 5 Mbps valid for 24 hours",
	}

	// 3. Subscribers
	s.subscribers["budi-pppoe"] = Subscriber{
		ID:        "sub-1",
		Username:  "budi-pppoe",
		Password:  "password123",
		ProfileID: "prof-home-10m",
		Status:    "active",
		ExpireAt:  time.Now().AddDate(0, 1, 0).Format(time.RFC3339),
		QuotaMB:   0,
		UsedMB:    14250,
		FramedIP:  "10.10.20.14",
		MACAddr:   "48:8F:5A:22:11:01",
		CreatedAt: time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
	}
	s.subscribers["kantor-fiber"] = Subscriber{
		ID:        "sub-2",
		Username:  "kantor-fiber",
		Password:  "fiber2026",
		ProfileID: "prof-ultra-50m",
		Status:    "active",
		ExpireAt:  time.Now().AddDate(0, 3, 0).Format(time.RFC3339),
		QuotaMB:   500000,
		UsedMB:    128400,
		FramedIP:  "10.10.20.88",
		MACAddr:   "00:1A:2B:3C:4D:5E",
		CreatedAt: time.Now().AddDate(0, -5, 0).Format(time.RFC3339),
	}
	s.subscribers["WIFI-7492"] = Subscriber{
		ID:        "sub-3",
		Username:  "WIFI-7492",
		Password:  "7492",
		ProfileID: "prof-voucher-24h",
		Status:    "active",
		ExpireAt:  time.Now().Add(18 * time.Hour).Format(time.RFC3339),
		QuotaMB:   5000,
		UsedMB:    1840,
		FramedIP:  "192.168.88.204",
		MACAddr:   "BC:D0:74:9A:12:34",
		CreatedAt: time.Now().Add(-6 * time.Hour).Format(time.RFC3339),
	}

	// 4. Seed Online Sessions (active connections on MikroTik)
	s.sessions["sess-mikrotik-01"] = OnlineSession{
		SessionID:   "sess-mikrotik-01",
		Username:    "budi-pppoe",
		NasIP:       "192.168.88.1",
		FramedIP:    "10.10.20.14",
		MACAddr:     "48:8F:5A:22:11:01",
		StartTime:   time.Now().Add(-4 * time.Hour).Format(time.RFC3339),
		LastUpdate:  time.Now().Format(time.RFC3339),
		InputBytes:  482910400,   // ~480 MB Upload
		OutputBytes: 1948201900,  // ~1.9 GB Download
		RateLimit:   "10M/10M",
		NasPort:     1,
	}
	s.sessions["sess-mikrotik-02"] = OnlineSession{
		SessionID:   "sess-mikrotik-02",
		Username:    "WIFI-7492",
		NasIP:       "192.168.88.1",
		FramedIP:    "192.168.88.204",
		MACAddr:     "BC:D0:74:9A:12:34",
		StartTime:   time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		LastUpdate:  time.Now().Format(time.RFC3339),
		InputBytes:  84291000,  // ~84 MB Upload
		OutputBytes: 948201000, // ~948 MB Download
		RateLimit:   "5M/5M",
		NasPort:     2,
	}
}

// FindNas finds NAS by IP address. Fallback to default if testing on localhost.
func (s *RadiusStore) FindNas(ip string) (Nas, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	nas, exists := s.nasList[ip]
	if exists {
		return nas, true
	}
	// Fallback to loopback secret for easy testing
	if ip == "127.0.0.1" || ip == "::1" || ip == "[::1]" {
		return Nas{
			ID:      "nas-loopback",
			IPAddr:  ip,
			Secret:  "testing123",
			Vendor:  "MikroTik",
			CoAPort: 3799,
		}, true
	}
	return Nas{}, false
}

// Authenticate verifies subscriber credentials
func (s *RadiusStore) Authenticate(username, password string) (*Subscriber, *RateProfile, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.authRequests++

	sub, exists := s.subscribers[username]
	if !exists {
		s.authRejects++
		return nil, nil, fmt.Errorf("user not found: %s", username)
	}

	if sub.Password != password {
		s.authRejects++
		return nil, nil, fmt.Errorf("invalid password for: %s", username)
	}

	if sub.Status != "active" {
		s.authRejects++
		return nil, nil, fmt.Errorf("subscriber is %s", sub.Status)
	}

	prof, pExists := s.profiles[sub.ProfileID]
	if !pExists {
		prof = RateProfile{
			ID:        "prof-default",
			Name:      "Standard 10M",
			RateLimit: "10M/10M",
		}
	}

	s.authAccepts++
	return &sub, &prof, nil
}

// AccountingProcess processes Accounting-Request (Start, Interim, Stop)
func (s *RadiusStore) AccountingProcess(pkt *RadiusPacket) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.acctRequests++

	statusType := pkt.GetUint32(AttrAcctStatusType)
	sessionID := pkt.GetString(AttrAcctSessionID)
	username := pkt.GetString(AttrUserName)
	clientIP := pkt.GetIP(AttrFramedIPAddress)
	macAddr := pkt.GetString(AttrCallingStationID)
	nasIP := pkt.GetIP(AttrNASIPAddress)

	inOctets := int64(pkt.GetUint32(AttrAcctInputOctets))
	outOctets := int64(pkt.GetUint32(AttrAcctOutputOctets))

	ipStr := ""
	if clientIP != nil {
		ipStr = clientIP.String()
	}
	nasIPStr := ""
	if nasIP != nil {
		nasIPStr = nasIP.String()
	}

	switch statusType {
	case 1: // Start
		s.sessions[sessionID] = OnlineSession{
			SessionID:   sessionID,
			Username:    username,
			NasIP:       nasIPStr,
			FramedIP:    ipStr,
			MACAddr:     macAddr,
			StartTime:   time.Now().Format(time.RFC3339),
			LastUpdate:  time.Now().Format(time.RFC3339),
			InputBytes:  inOctets,
			OutputBytes: outOctets,
			RateLimit:   "10M/10M",
			NasPort:     pkt.GetUint32(AttrNASPort),
		}

	case 3: // Interim-Update
		if sess, exists := s.sessions[sessionID]; exists {
			sess.InputBytes = inOctets
			sess.OutputBytes = outOctets
			sess.LastUpdate = time.Now().Format(time.RFC3339)
			s.sessions[sessionID] = sess
		}

	case 2: // Stop
		delete(s.sessions, sessionID)
		if sub, exists := s.subscribers[username]; exists {
			sub.UsedMB += (inOctets + outOctets) / (1024 * 1024)
			s.subscribers[username] = sub
		}
	}
}

// BatchGenerateVouchers creates N vouchers (ToughRADIUS voucher generator)
func (s *RadiusStore) BatchGenerateVouchers(count int, prefix string, profileID string) []Subscriber {
	s.mu.Lock()
	defer s.mu.Unlock()

	var vouchers []Subscriber
	if prefix == "" {
		prefix = "WIFI-"
	}

	for i := 0; i < count; i++ {
		bytes := make([]byte, 2)
		_, _ = rand.Read(bytes)
		suffix := hex.EncodeToString(bytes)

		username := fmt.Sprintf("%s%s", prefix, suffix)
		password := fmt.Sprintf("%04d", time.Now().UnixNano()%10000)

		v := Subscriber{
			ID:        fmt.Sprintf("sub-vouch-%s", suffix),
			Username:  username,
			Password:  password,
			ProfileID: profileID,
			Status:    "active",
			ExpireAt:  time.Now().AddDate(0, 1, 0).Format(time.RFC3339),
			QuotaMB:   5000,
			UsedMB:    0,
			CreatedAt: time.Now().Format(time.RFC3339),
		}
		s.subscribers[username] = v
		vouchers = append(vouchers, v)
	}

	return vouchers
}
