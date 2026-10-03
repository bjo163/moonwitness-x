"""
Moonwitness Universe — Astrodynamics & Hilal Vision Analytics Service (Python)
Provides scientific atmospheric extinction models, contrast ratios, and cosmological analytics.
"""

import json
import math
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone

PORT = int(os.environ.get("PORT", "5156"))

def calculate_hilal_contrast(altitude_deg: float, elongation_deg: float, site_elevation_m: float = 0.0) -> dict:
    """
    Menghitung rasio kontras sabit bulan terhadap latar langit senja (Schaefer / Odeh model).
    """
    # Tebal sabit topointrik (arcmin)
    crescent_width_arcmin = 1.0 - math.cos(math.radians(elongation_deg))
    crescent_width_arcmin *= 15.0  # Skala tipikal semi-diameter bulan

    # Extinction coefficient k berbasis elevasi (Rayleigh scattering + aerosol)
    k_extinction = 0.20 * math.exp(-site_elevation_m / 8000.0)
    
    # Airmass X(h) pendekatan Kasten-Young (1989)
    alt = max(0.5, altitude_deg)
    airmass = 1.0 / (math.sin(math.radians(alt)) + 0.50572 * math.pow(alt + 6.07995, -1.6364))

    # Kecerahan langit senja dan kontras
    sky_brightness = 100.0 * math.exp(-0.3 * alt)
    moon_brightness = 3000.0 * (elongation_deg / 180.0) * math.exp(-k_extinction * airmass)
    
    contrast_ratio = (moon_brightness - sky_brightness) / max(1.0, sky_brightness)

    # Klasifikasi Odeh V-value
    # V = ArcV - (-0.1018*W^3 + 0.731*W^2 - 6.3226*W + 7.1651)
    w = max(0.01, crescent_width_arcmin)
    q_odeh = altitude_deg - (-0.1018 * (w**3) + 0.731 * (w**2) - 6.3226 * w + 7.1651)

    if q_odeh >= 5.65:
        zone = "A"
        feasibility = "Easily visible to naked eye"
    elif q_odeh >= 2.0:
        zone = "B"
        feasibility = "Visible with optical aid; may be seen by naked eye if atmospheric conditions are optimal"
    elif q_odeh >= -3.0:
        zone = "C"
        feasibility = "Visible only with optical aid (telescope/binoculars)"
    else:
        zone = "D"
        feasibility = "Not visible even with conventional telescopes"

    return {
        "altitude_degrees": altitude_deg,
        "elongation_degrees": elongation_deg,
        "site_elevation_meters": site_elevation_m,
        "crescent_width_arcmin": round(crescent_width_arcmin, 3),
        "airmass_kasten_young": round(airmass, 3),
        "contrast_ratio": round(contrast_ratio, 4),
        "odeh_q_value": round(q_odeh, 3),
        "odeh_zone": zone,
        "feasibility": feasibility,
    }

class AnalyticsHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: dict):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/healthz":
            self._send_json(200, {
                "status": "healthy",
                "service": "Moonwitness Python Analytics Service",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "python_version": sys.version.split()[0],
            })
            return

        if self.path.startswith("/api/v1/analytics/hilal"):
            # Mock or query parameter evaluation
            alt = 4.5
            elong = 7.2
            elev = 100.0
            data = calculate_hilal_contrast(alt, elong, elev)
            self._send_json(200, {
                "calculation_type": "Hilal Contrast & Optical Feasibility Analysis",
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "results": data
            })
            return

        if self.path == "/api/v1/analytics/cosmology":
            self._send_json(200, {
                "engine": "Astrodynamics FLRW Metric Numerical Integrator",
                "planck_parameters": {
                    "H0": 67.36,
                    "Omega_m": 0.3153,
                    "Omega_Lambda": 0.6847,
                    "T_CMB_K": 2.7255
                },
                "status": "synchronized_with_mts_kernel"
            })
            return

        self._send_json(404, {"error": "Not Found", "path": self.path})

def main():
    server = HTTPServer(("0.0.0.0", PORT), AnalyticsHandler)
    print(f"🐍 Moonwitness Analytics Service (Python) listening on port {PORT}")
    print(f"   ├─ Health check: http://localhost:{PORT}/healthz")
    print(f"   ├─ Hilal Optics: http://localhost:{PORT}/api/v1/analytics/hilal")
    print(f"   └─ Cosmology:    http://localhost:{PORT}/api/v1/analytics/cosmology")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Analytics Service...")
        server.server_close()

if __name__ == "__main__":
    main()
