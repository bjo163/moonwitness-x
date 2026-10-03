import type {
  CelestialClockState,
  CosmicTimeState,
  ConjunctionEvent,
  ScriptureCorrelationMatrix,
  AntikytheraGearsTelemetry,
  HilalEvaluationResponse,
  PrayerTimesApiResponse,
  EclipsesApiResponse,
} from '@moonwitness/types';

export class MoonwitnessClient {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:5155') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Mengambil telemetri jam astronomis sejati saat ini (TCC, Hijriah, Antikythera)
   */
  async getNow(): Promise<CelestialClockState> {
    const res = await fetch(`${this.baseUrl}/api/v1/time/now`);
    if (!res.ok) throw new Error(`Failed to fetch time now: ${res.statusText}`);
    return res.json();
  }

  /**
   * Mengambil telemetri lengkap seluruh gear train Antikythera
   */
  async getGears(): Promise<AntikytheraGearsTelemetry> {
    const res = await fetch(`${this.baseUrl}/api/v1/time/gears`);
    if (!res.ok) throw new Error(`Failed to fetch gears telemetry: ${res.statusText}`);
    return res.json();
  }

  /**
   * Evaluasi visibilitas Hilal & konjungsi astronomis berdasarkan koordinat toposentrik
   */
  async getHilal(lat?: number, lon?: number, elevation?: number): Promise<HilalEvaluationResponse> {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lon !== undefined) params.append('lon', lon.toString());
    if (elevation !== undefined) params.append('elevation', elevation.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/api/v1/time/hilal${query}`);
    if (!res.ok) throw new Error(`Failed to fetch hilal evaluation: ${res.statusText}`);
    return res.json();
  }

  /**
   * Mengambil snapshot Waktu Semesta & Kosmologi FLRW
   */
  async getCosmic(): Promise<CosmicTimeState> {
    const res = await fetch(`${this.baseUrl}/api/v1/cosmic`);
    if (!res.ok) throw new Error(`Failed to fetch cosmic state: ${res.statusText}`);
    return res.json();
  }

  /**
   * Mengambil matriks korelasi 4 Kitab Wahyu (Al-Qur'an, Injil, Taurat, Zabur)
   */
  async getRevelations(): Promise<ScriptureCorrelationMatrix> {
    const res = await fetch(`${this.baseUrl}/api/v1/cosmic/revelations`);
    if (!res.ok) throw new Error(`Failed to fetch revelations matrix: ${res.statusText}`);
    return res.json();
  }

  /**
   * Mengambil estimasi dan hitung mundur ijtimak (konjungsi) berikutnya
   */
  async getNextConjunction(): Promise<ConjunctionEvent> {
    const res = await fetch(`${this.baseUrl}/api/v1/time/conjunction/next`);
    if (!res.ok) throw new Error(`Failed to fetch conjunction: ${res.statusText}`);
    return res.json();
  }

  /**
   * Mengambil jadwal waktu shalat astronomis & arah kiblat presisi tinggi
   */
  async getPrayerTimes(params?: { lat?: number; lon?: number; elevation?: number }): Promise<PrayerTimesApiResponse> {
    const q = new URLSearchParams();
    if (params?.lat !== undefined) q.append('lat', params.lat.toString());
    if (params?.lon !== undefined) q.append('lon', params.lon.toString());
    if (params?.elevation !== undefined) q.append('elevation', params.elevation.toString());
    const query = q.toString() ? `?${q.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/api/v1/time/prayer-times${query}`);
    if (!res.ok) throw new Error(`Failed to fetch prayer times: ${res.statusText}`);
    return res.json();
  }

  /**
   * Mengambil prediksi gerhana matahari dan gerhana bulan berikutnya berbasis siklus Saros
   */
  async getEclipses(): Promise<EclipsesApiResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/time/eclipses`);
    if (!res.ok) throw new Error(`Failed to fetch eclipses: ${res.statusText}`);
    return res.json();
  }

  /**
   * Mengambil tanggal kalender Hijriah hari ini
   */
  async getHijriToday(): Promise<{ year: number; month: number; day: number; month_name: string; formatted: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/hijri/today`);
    if (!res.ok) throw new Error(`Failed to fetch hijri today: ${res.statusText}`);
    return res.json();
  }
}

export * from '@moonwitness/types';

