package main

import (
	"fmt"
	"log"
	"net"
	"strings"
	"time"
)

// RadiusServer handles UDP RADIUS packets on port 1812 (Auth) and 1813 (Acct)
type RadiusServer struct {
	authPort int
	acctPort int
	store    *RadiusStore
	authConn *net.UDPConn
	acctConn *net.UDPConn
}

func NewRadiusServer(authPort, acctPort int, store *RadiusStore) *RadiusServer {
	return &RadiusServer{
		authPort: authPort,
		acctPort: acctPort,
		store:    store,
	}
}

// Start launches Auth (1812) and Accounting (1813) listeners
func (rs *RadiusServer) Start() error {
	// 1. Start Auth Listener (UDP 1812)
	authAddr, err := net.ResolveUDPAddr("udp", fmt.Sprintf(":%d", rs.authPort))
	if err != nil {
		return fmt.Errorf("resolve auth addr failed: %w", err)
	}

	authConn, err := net.ListenUDP("udp", authAddr)
	if err != nil {
		return fmt.Errorf("listen auth udp failed: %w", err)
	}
	rs.authConn = authConn
	log.Printf("📡 RADIUS Authentication Server (UDP) listening on :%d", rs.authPort)

	go rs.listenAuth()

	// 2. Start Accounting Listener (UDP 1813)
	acctAddr, err := net.ResolveUDPAddr("udp", fmt.Sprintf(":%d", rs.acctPort))
	if err != nil {
		return fmt.Errorf("resolve acct addr failed: %w", err)
	}

	acctConn, err := net.ListenUDP("udp", acctAddr)
	if err != nil {
		return fmt.Errorf("listen acct udp failed: %w", err)
	}
	rs.acctConn = acctConn
	log.Printf("📊 RADIUS Accounting Server (UDP) listening on :%d", rs.acctPort)

	go rs.listenAcct()

	return nil
}

func (rs *RadiusServer) listenAuth() {
	buf := make([]byte, 4096)
	for {
		n, remoteAddr, err := rs.authConn.ReadFromUDP(buf)
		if err != nil {
			log.Printf("Auth read error: %v", err)
			return
		}

		packetData := make([]byte, n)
		copy(packetData, buf[:n])

		go rs.handleAuthPacket(packetData, remoteAddr)
	}
}

func (rs *RadiusServer) handleAuthPacket(data []byte, remoteAddr *net.UDPAddr) {
	nasIP := remoteAddr.IP.String()
	nas, ok := rs.store.FindNas(nasIP)
	secret := "testing123"
	if ok && nas.Secret != "" {
		secret = nas.Secret
	}

	pkt, err := DecodeRadiusPacket(data, secret)
	if err != nil {
		log.Printf("Invalid RADIUS packet from %s: %v", remoteAddr, err)
		return
	}

	if pkt.Code != CodeAccessRequest {
		log.Printf("Ignored non-Access-Request packet on Auth port: Code %d", pkt.Code)
		return
	}

	username := pkt.GetString(AttrUserName)
	rawPassword := pkt.GetString(AttrUserPassword)

	// Decrypt PAP User-Password
	password := DecryptPAPPassword([]byte(rawPassword), pkt.Authenticator, secret)
	log.Printf("🔑 [RADIUS-AUTH] Access-Request for user '%s' from NAS %s", username, remoteAddr)

	sub, profile, authErr := rs.store.Authenticate(username, password)

	resp := &RadiusPacket{
		Identifier:    pkt.Identifier,
		Authenticator: pkt.Authenticator,
		Secret:        secret,
	}

	if authErr != nil {
		log.Printf("❌ [RADIUS-REJECT] Auth failed for '%s': %v", username, authErr)
		resp.Code = CodeAccessReject
		resp.AddString(AttrFilterID, authErr.Error())
	} else {
		log.Printf("✅ [RADIUS-ACCEPT] Auth success for '%s', RateLimit: %s", username, profile.RateLimit)
		resp.Code = CodeAccessAccept
		resp.AddString(AttrUserName, username)

		// Assign Framed IP if configured
		if sub.FramedIP != "" {
			if ip := net.ParseIP(sub.FramedIP); ip != nil {
				resp.AddIP(AttrFramedIPAddress, ip)
			}
		}

		// Inject MikroTik-Rate-Limit (Vendor 14988, VSA 8)
		if profile.RateLimit != "" {
			resp.AddMikroTikRateLimit(profile.RateLimit)
		}

		// Session Timeout in seconds
		resp.AddUint32(AttrSessionTimeout, 86400) // 24 hours
	}

	respBytes := resp.Encode()
	_, _ = rs.authConn.WriteToUDP(respBytes, remoteAddr)
}

func (rs *RadiusServer) listenAcct() {
	buf := make([]byte, 4096)
	for {
		n, remoteAddr, err := rs.acctConn.ReadFromUDP(buf)
		if err != nil {
			log.Printf("Acct read error: %v", err)
			return
		}

		packetData := make([]byte, n)
		copy(packetData, buf[:n])

		go rs.handleAcctPacket(packetData, remoteAddr)
	}
}

func (rs *RadiusServer) handleAcctPacket(data []byte, remoteAddr *net.UDPAddr) {
	nasIP := remoteAddr.IP.String()
	nas, ok := rs.store.FindNas(nasIP)
	secret := "testing123"
	if ok && nas.Secret != "" {
		secret = nas.Secret
	}

	pkt, err := DecodeRadiusPacket(data, secret)
	if err != nil {
		return
	}

	if pkt.Code != CodeAccountingRequest {
		return
	}

	// Update accounting records in store
	rs.store.AccountingProcess(pkt)

	// Send Accounting-Response
	resp := &RadiusPacket{
		Code:          CodeAccountingResponse,
		Identifier:    pkt.Identifier,
		Authenticator: pkt.Authenticator,
		Secret:        secret,
	}

	respBytes := resp.Encode()
	_, _ = rs.acctConn.WriteToUDP(respBytes, remoteAddr)
}

// DisconnectSession sends RFC 3576 Packet of Disconnect (PoD) to MikroTik on UDP 3799
func (rs *RadiusServer) DisconnectSession(session OnlineSession) error {
	nas, ok := rs.store.FindNas(session.NasIP)
	secret := "testing123"
	coaPort := 3799
	if ok {
		if nas.Secret != "" {
			secret = nas.Secret
		}
		if nas.CoAPort > 0 {
			coaPort = nas.CoAPort
		}
	}

	targetAddr := fmt.Sprintf("%s:%d", session.NasIP, coaPort)
	udpAddr, err := net.ResolveUDPAddr("udp", targetAddr)
	if err != nil {
		return fmt.Errorf("resolve coa target failed: %w", err)
	}

	pkt := &RadiusPacket{
		Code:          CodeDisconnectRequest,
		Identifier:    byte(time.Now().Unix() % 255),
		Secret:        secret,
		Authenticator: [16]byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10},
	}

	pkt.AddString(AttrUserName, session.Username)
	pkt.AddString(AttrAcctSessionID, session.SessionID)
	if session.FramedIP != "" {
		if ip := net.ParseIP(session.FramedIP); ip != nil {
			pkt.AddIP(AttrFramedIPAddress, ip)
		}
	}

	conn, err := net.DialUDP("udp", nil, udpAddr)
	if err != nil {
		return fmt.Errorf("dial coa udp failed: %w", err)
	}
	defer conn.Close()

	_ = conn.SetDeadline(time.Now().Add(3 * time.Second))
	_, err = conn.Write(pkt.Encode())
	if err != nil {
		return fmt.Errorf("write coa packet failed: %w", err)
	}

	// Remove from active store immediately
	rs.store.mu.Lock()
	delete(rs.store.sessions, session.SessionID)
	rs.store.mu.Unlock()

	log.Printf("🔌 [PoD/CoA] Disconnect-Request sent to MikroTik %s for user %s (Session: %s)", targetAddr, session.Username, session.SessionID)
	return nil
}

// SimulateTestAuth simulates a RADIUS Access-Request to test credentials locally
func (rs *RadiusServer) SimulateTestAuth(username, password, nasIP string) (map[string]interface{}, error) {
	sub, profile, err := rs.store.Authenticate(username, password)
	if err != nil {
		return map[string]interface{}{
			"result":     "Access-Reject",
			"code":       CodeAccessReject,
			"username":   username,
			"error":      err.Error(),
			"tested_at":  time.Now().Format(time.RFC3339),
		}, nil
	}

	return map[string]interface{}{
		"result":              "Access-Accept",
		"code":                CodeAccessAccept,
		"username":            username,
		"rate_limit_applied":  profile.RateLimit,
		"assigned_framed_ip":  sub.FramedIP,
		"assigned_profile":    profile.Name,
		"session_timeout_sec": 86400,
		"mikrotik_vsa": map[string]interface{}{
			"vendor_id": 14988,
			"attr_type": 8,
			"raw_value": strings.TrimSpace(profile.RateLimit),
		},
		"tested_at": time.Now().Format(time.RFC3339),
	}, nil
}
