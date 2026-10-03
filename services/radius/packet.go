package main

import (
	"bytes"
	"crypto/md5"
	"encoding/binary"
	"fmt"
	"net"
)

// Standard RADIUS Codes (RFC 2865, RFC 2866, RFC 3576)
const (
	CodeAccessRequest      = 1
	CodeAccessAccept       = 2
	CodeAccessReject       = 3
	CodeAccountingRequest  = 4
	CodeAccountingResponse = 5
	CodeDisconnectRequest  = 40 // PoD (Packet of Disconnect)
	CodeDisconnectACK      = 41
	CodeDisconnectNAK      = 42
	CodeCoARequest         = 43
	CodeCoAACK             = 44
	CodeCoANAK             = 45
)

// Standard RADIUS Attribute Types
const (
	AttrUserName            = 1
	AttrUserPassword        = 2
	AttrNASIPAddress        = 4
	AttrNASPort             = 5
	AttrServiceType         = 6
	AttrFramedProtocol      = 7
	AttrFramedIPAddress     = 8
	AttrFramedIPNetmask     = 9
	AttrFilterID            = 11
	AttrClass               = 25
	AttrVendorSpecific      = 26
	AttrSessionTimeout      = 27
	AttrIdleTimeout         = 28
	AttrCalledStationID     = 30
	AttrCallingStationID    = 31 // User MAC Address
	AttrNASIdentifier       = 32
	AttrAcctStatusType      = 40 // 1: Start, 2: Stop, 3: Interim-Update
	AttrAcctDelayTime       = 41
	AttrAcctInputOctets     = 42
	AttrAcctOutputOctets    = 43
	AttrAcctSessionID       = 44
	AttrAcctAuthentic       = 45
	AttrAcctSessionTime     = 46
	AttrAcctInputGigawords  = 52
	AttrAcctOutputGigawords = 53
)

// MikroTik Vendor Specific Attributes (Vendor ID = 14988)
const (
	VendorMikroTik          = 14988
	MikroTikRecvLimit       = 1
	MikroTikXmitLimit       = 2
	MikroTikGroup           = 3
	MikroTikWirelessForward = 4
	MikroTikRateLimit       = 8 // Format: "{rx-rate}[k|M]/{tx-rate}[k|M]" e.g. "10M/10M" or "10240k/30720k"
)

// RadiusAttribute represents a single AV pair
type RadiusAttribute struct {
	Type  byte
	Value []byte
}

// RadiusPacket represents an RFC 2865/2866 packet
type RadiusPacket struct {
	Code          byte
	Identifier    byte
	Authenticator [16]byte
	Attributes    []RadiusAttribute
	Secret        string
}

// DecodeRadiusPacket parses raw UDP bytes into a RadiusPacket
func DecodeRadiusPacket(data []byte, secret string) (*RadiusPacket, error) {
	if len(data) < 20 {
		return nil, fmt.Errorf("packet too short: %d bytes (min 20)", len(data))
	}

	p := &RadiusPacket{
		Code:       data[0],
		Identifier: data[1],
		Secret:     secret,
	}

	pktLen := binary.BigEndian.Uint16(data[2:4])
	if int(pktLen) > len(data) || pktLen < 20 {
		return nil, fmt.Errorf("invalid packet length field: %d (actual: %d)", pktLen, len(data))
	}

	copy(p.Authenticator[:], data[4:20])

	// Parse attributes
	offset := 20
	for offset < int(pktLen) {
		if offset+2 > int(pktLen) {
			break
		}
		aType := data[offset]
		aLen := int(data[offset+1])
		if aLen < 2 || offset+aLen > int(pktLen) {
			break
		}
		val := make([]byte, aLen-2)
		copy(val, data[offset+2:offset+aLen])

		p.Attributes = append(p.Attributes, RadiusAttribute{
			Type:  aType,
			Value: val,
		})
		offset += aLen
	}

	return p, nil
}

// Encode builds raw UDP wire bytes and calculates response authenticator
func (p *RadiusPacket) Encode() []byte {
	buf := new(bytes.Buffer)
	buf.WriteByte(p.Code)
	buf.WriteByte(p.Identifier)
	buf.Write([]byte{0, 0}) // Placeholder for length
	buf.Write(p.Authenticator[:])

	for _, attr := range p.Attributes {
		buf.WriteByte(attr.Type)
		buf.WriteByte(byte(len(attr.Value) + 2))
		buf.Write(attr.Value)
	}

	raw := buf.Bytes()
	binary.BigEndian.PutUint16(raw[2:4], uint16(len(raw)))

	// For Access-Accept, Access-Reject, Accounting-Response, or Disconnect packets,
	// calculate MD5 Response Authenticator = MD5(Code + ID + Length + RequestAuth + Attributes + Secret)
	if p.Code == CodeAccessAccept || p.Code == CodeAccessReject ||
		p.Code == CodeAccountingResponse || p.Code == CodeDisconnectACK || p.Code == CodeDisconnectNAK {
		h := md5.New()
		h.Write(raw[:4])
		h.Write(p.Authenticator[:])
		h.Write(raw[20:])
		h.Write([]byte(p.Secret))
		respAuth := h.Sum(nil)
		copy(raw[4:20], respAuth)
	}

	return raw
}

// GetString returns the string value of the first attribute matching aType
func (p *RadiusPacket) GetString(aType byte) string {
	for _, a := range p.Attributes {
		if a.Type == aType {
			return string(a.Value)
		}
	}
	return ""
}

// GetUint32 returns 32-bit uint value of attribute
func (p *RadiusPacket) GetUint32(aType byte) uint32 {
	for _, a := range p.Attributes {
		if a.Type == aType && len(a.Value) >= 4 {
			return binary.BigEndian.Uint32(a.Value[:4])
		}
	}
	return 0
}

// GetIP returns IP address of attribute
func (p *RadiusPacket) GetIP(aType byte) net.IP {
	for _, a := range p.Attributes {
		if a.Type == aType && len(a.Value) == 4 {
			return net.IPv4(a.Value[0], a.Value[1], a.Value[2], a.Value[3])
		}
	}
	return nil
}

// AddString appends a string attribute
func (p *RadiusPacket) AddString(aType byte, s string) {
	p.Attributes = append(p.Attributes, RadiusAttribute{
		Type:  aType,
		Value: []byte(s),
	})
}

// AddUint32 appends a 32-bit integer attribute
func (p *RadiusPacket) AddUint32(aType byte, v uint32) {
	b := make([]byte, 4)
	binary.BigEndian.PutUint32(b, v)
	p.Attributes = append(p.Attributes, RadiusAttribute{
		Type:  aType,
		Value: b,
	})
}

// AddIP appends an IPv4 attribute
func (p *RadiusPacket) AddIP(aType byte, ip net.IP) {
	ipv4 := ip.To4()
	if ipv4 != nil {
		p.Attributes = append(p.Attributes, RadiusAttribute{
			Type:  aType,
			Value: ipv4,
		})
	}
}

// AddMikroTikRateLimit appends a Vendor Specific Attribute (VSA) for MikroTik
// ToughRADIUS Style: Vendor=14988, Type=8, Value="{rx}k/{tx}k" or "10M/10M"
func (p *RadiusPacket) AddMikroTikRateLimit(rateLimit string) {
	// VSA wire format: [4 bytes VendorID] [1 byte Type] [1 byte Length] [Value]
	vsaBuf := new(bytes.Buffer)
	vendorID := make([]byte, 4)
	binary.BigEndian.PutUint32(vendorID, VendorMikroTik)
	vsaBuf.Write(vendorID)

	valBytes := []byte(rateLimit)
	vsaBuf.WriteByte(MikroTikRateLimit)
	vsaBuf.WriteByte(byte(len(valBytes) + 2))
	vsaBuf.Write(valBytes)

	p.Attributes = append(p.Attributes, RadiusAttribute{
		Type:  AttrVendorSpecific,
		Value: vsaBuf.Bytes(),
	})
}

// DecryptPAPPassword decrypts a PAP User-Password attribute using MD5 XOR (RFC 2865)
func DecryptPAPPassword(encPassword []byte, requestAuth [16]byte, secret string) string {
	if len(encPassword) == 0 || len(encPassword)%16 != 0 {
		return string(encPassword) // Raw fallback
	}

	var decrypted []byte
	lastCipher := requestAuth[:]

	for i := 0; i < len(encPassword); i += 16 {
		chunk := encPassword[i : i+16]

		h := md5.New()
		h.Write([]byte(secret))
		h.Write(lastCipher)
		digest := h.Sum(nil)

		plain := make([]byte, 16)
		for j := 0; j < 16; j++ {
			plain[j] = chunk[j] ^ digest[j]
		}
		decrypted = append(decrypted, plain...)
		lastCipher = chunk
	}

	// Remove trailing null padding bytes
	return string(bytes.TrimRight(decrypted, "\x00"))
}
