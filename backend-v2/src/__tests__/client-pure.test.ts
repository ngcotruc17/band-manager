/**
 * Frontend Pure Logic & Domain Contracts Unit Tests
 * Covers: Chord transposition, Audio/Time formatting, URL resolution, QR parsing, Fine rates
 */

// ==========================================
// 1. PURE DOMAIN IMPLEMENTATIONS & CONTRACTS
// ==========================================

export const SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLATS_MAP: Record<string, string> = {
  "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"
};

/**
 * Transposes a chord by the given number of semitones.
 * Preserves suffixes (e.g. m, 7, maj7, sus4, /B) and handles enharmonic flats.
 */
export const transposeChord = (chord: string, semitones: number): string => {
  if (!chord || typeof chord !== 'string') return chord;

  let root = "";
  let suffix = "";

  if (chord.length > 1 && (chord[1] === "#" || chord[1] === "b")) {
    root = chord.slice(0, 2);
    suffix = chord.slice(2);
  } else {
    root = chord.slice(0, 1);
    suffix = chord.slice(1);
  }

  if (FLATS_MAP[root]) {
    root = FLATS_MAP[root];
  }

  const idx = SCALE.indexOf(root.toUpperCase());
  if (idx === -1) return chord;

  // Mathematically robust positive modulo to handle negative semitones < -12
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return SCALE[newIdx] + suffix;
};

/**
 * Transposes all bracketed chords in a lyrics/chords text.
 */
export const transposeText = (text: string, semitones: number): string => {
  if (!text || semitones === 0) return text;
  return text.replace(/\[([^\]]+)\]/g, (_match, chord) => {
    return `[${transposeChord(chord, semitones)}]`;
  });
};

/**
 * Formats duration in seconds to MM:SS string with zero-padding.
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Resolves base API or backend URL based on client hostname or environment.
 */
export const resolveBaseUrl = (options?: { hostname?: string; envUrl?: string }): string => {
  const hostname = options?.hostname;
  if (hostname) {
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isLocal) {
      return `http://${hostname}:5000`;
    }
  }
  if (options?.envUrl) {
    const raw = options.envUrl.replace(/\/$/, "");
    return raw;
  }
  return "https://band-manager-s9tm.onrender.com";
};

/**
 * Resolves full API URL with /api suffix.
 */
export const getAPIUrl = (options?: { hostname?: string; envUrl?: string }): string => {
  const base = resolveBaseUrl(options);
  return base.endsWith("/api") ? base : `${base}/api`;
};

/**
 * Resolves audio track URL with relative or absolute fallbacks.
 */
export const resolveAudioUrl = (url: string, baseUrl: string): string => {
  if (!url) return "";
  const cleanedUrl = url.startsWith("/") ? url.substring(1) : url;
  return url.includes("http") ? url : `${baseUrl}/${cleanedUrl}`;
};

export interface ParsedQRCheckIn {
  token: string;
  rehearsalId: string | null;
}

/**
 * Parses QR check-in data from raw tokens, full query URLs, or path-based URLs.
 */
export const parseQRCheckIn = (data: string): ParsedQRCheckIn => {
  if (!data) return { token: "", rehearsalId: null };
  let token = data;
  let rehearsalId: string | null = null;
  try {
    const url = new URL(data);
    const t = url.searchParams.get("token");
    const rId = url.searchParams.get("rehearsalId") || url.pathname.split("/checkin/")[1];
    if (t) token = t;
    if (rId) rehearsalId = rId;
  } catch {
    // raw token string
  }
  return { token: token.trim(), rehearsalId };
};

export const FINE_RATES = {
  LATE: 50000,
  ABSENT: 100000,
  ON_TIME: 0,
  EXCUSED: 0
} as const;

export const calculateAttendanceFine = (status: "present" | "late" | "absent" | "excused" | "pending"): number => {
  switch (status) {
    case "late":
      return FINE_RATES.LATE;
    case "absent":
      return FINE_RATES.ABSENT;
    case "present":
    case "excused":
    case "pending":
    default:
      return 0;
  }
};

// ==========================================
// 2. TEST SUITE RUNNER
// ==========================================

export const runClientPureTests = (): { passed: boolean; details: string[] } => {
  const details: string[] = [];
  let passed = true;

  const assert = (condition: boolean, msg: string, failureDetail?: string) => {
    if (condition) {
      details.push(`✅ ${msg}`);
    } else {
      passed = false;
      details.push(`❌ ${msg} - ${failureDetail || "Assertion failed"}`);
    }
  };

  // ----------------------------------------------------
  // Chords & Transposition Tests
  // ----------------------------------------------------
  assert(transposeChord("C", 1) === "C#", "Transpose C +1 step -> C#");
  assert(transposeChord("C", 2) === "D", "Transpose C +2 steps -> D");
  assert(transposeChord("B", 1) === "C", "Transpose B +1 step (wrap-around) -> C");
  assert(transposeChord("C", -1) === "B", "Transpose C -1 step (downward wrap) -> B");
  assert(transposeChord("C", -5) === "G", "Transpose C -5 steps -> G");
  assert(transposeChord("A", 12) === "A", "Transpose A +12 steps (octave loop) -> A");
  assert(transposeChord("A", -12) === "A", "Transpose A -12 steps (negative octave loop) -> A");
  assert(transposeChord("Db", 1) === "D", "Transpose flat Db +1 step -> D");
  assert(transposeChord("Eb", 2) === "F", "Transpose flat Eb +2 steps -> F");
  assert(transposeChord("Bb", 2) === "C", "Transpose flat Bb +2 steps -> C");
  assert(transposeChord("F#m7", 1) === "Gm7", "Transpose sharp chord F#m7 +1 step -> Gm7");
  assert(transposeChord("Cmaj7", 2) === "Dmaj7", "Transpose compound chord Cmaj7 +2 steps -> Dmaj7");
  assert(transposeChord("Intro", 2) === "Intro", "Preserve non-chord token 'Intro' unchanged");
  assert(transposeChord("", 2) === "", "Handle empty chord string gracefully");

  const lyrics = "[G]Chẳng biết từ bao giờ [Em]em đã mong chờ\n[Am]Chờ một tình yêu";
  const expectedLyrics = "[A]Chẳng biết từ bao giờ [F#m]em đã mong chờ\n[Bm]Chờ một tình yêu";
  assert(transposeText(lyrics, 2) === expectedLyrics, "Transpose Vietnamese lyrics with embedded chords (+2)");
  assert(transposeText(lyrics, 0) === lyrics, "Transpose text with 0 semitones returns unchanged");

  // ----------------------------------------------------
  // Audio & Time Formatting Tests
  // ----------------------------------------------------
  assert(formatTime(0) === "00:00", "Format 0 seconds -> 00:00");
  assert(formatTime(-10) === "00:00", "Format negative seconds -> 00:00");
  assert(formatTime(NaN) === "00:00", "Format NaN seconds -> 00:00");
  assert(formatTime(9) === "00:09", "Format 9 seconds -> 00:09");
  assert(formatTime(45) === "00:45", "Format 45 seconds -> 00:45");
  assert(formatTime(60) === "01:00", "Format 60 seconds -> 01:00");
  assert(formatTime(65) === "01:05", "Format 65 seconds -> 01:05");
  assert(formatTime(125.7) === "02:05", "Format float seconds 125.7 -> 02:05");
  assert(formatTime(3600) === "60:00", "Format 3600 seconds (1 hour) -> 60:00");

  // ----------------------------------------------------
  // URL Resolution Tests
  // ----------------------------------------------------
  assert(resolveBaseUrl({ hostname: "localhost" }) === "http://localhost:5000", "Resolve local hostname 'localhost' -> port 5000");
  assert(resolveBaseUrl({ hostname: "192.168.1.50" }) === "http://192.168.1.50:5000", "Resolve LAN IP hostname -> port 5000");
  assert(resolveBaseUrl({ hostname: "band.fptu.edu.vn" }) === "https://band-manager-s9tm.onrender.com", "Resolve public domain -> fallback Render server");
  assert(getAPIUrl({ hostname: "localhost" }) === "http://localhost:5000/api", "Resolve getAPIUrl for localhost -> http://localhost:5000/api");
  assert(getAPIUrl({ envUrl: "https://my-api.com" }) === "https://my-api.com/api", "Resolve getAPIUrl with environment URL");
  assert(resolveAudioUrl("/uploads/beats/song.mp3", "http://localhost:5000") === "http://localhost:5000/uploads/beats/song.mp3", "Resolve relative track URL with leading slash");
  assert(resolveAudioUrl("https://storage.cdn/audio.mp3", "http://localhost:5000") === "https://storage.cdn/audio.mp3", "Preserve absolute audio URL");

  // ----------------------------------------------------
  // QR Token Parsing Tests
  // ----------------------------------------------------
  const qrUrl1 = "https://band.fptu.edu.vn/checkin?rehearsalId=65e1234567890abcdef12345&token=jwt_sample_token_abc";
  const parsed1 = parseQRCheckIn(qrUrl1);
  assert(parsed1.token === "jwt_sample_token_abc" && parsed1.rehearsalId === "65e1234567890abcdef12345", "Parse QR query URL with rehearsalId & token");

  const qrUrl2 = "https://band.fptu.edu.vn/checkin/65e1234567890abcdef12345?token=jwt_sample_token_xyz";
  const parsed2 = parseQRCheckIn(qrUrl2);
  assert(parsed2.token === "jwt_sample_token_xyz" && parsed2.rehearsalId === "65e1234567890abcdef12345", "Parse QR path URL /checkin/:id?token=...");

  const rawToken = "  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.raw_token  ";
  const parsedRaw = parseQRCheckIn(rawToken);
  assert(parsedRaw.token === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.raw_token" && parsedRaw.rehearsalId === null, "Parse raw token with trimmed whitespace");

  // ----------------------------------------------------
  // Fine Rates & Contract Tests
  // ----------------------------------------------------
  assert(FINE_RATES.LATE === 50000, "Fine contract: Late fine is exactly 50,000 VND");
  assert(FINE_RATES.ABSENT === 100000, "Fine contract: Absent fine is exactly 100,000 VND");
  assert(calculateAttendanceFine("present") === 0, "Fine calculation: On time attendance fine is 0 VND");
  assert(calculateAttendanceFine("late") === 50000, "Fine calculation: Late attendance fine is 50,000 VND");
  assert(calculateAttendanceFine("absent") === 100000, "Fine calculation: Absent attendance fine is 100,000 VND");

  return { passed, details };
};
