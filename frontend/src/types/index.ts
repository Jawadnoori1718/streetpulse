// ============================================================
// StreetPulse — Shared TypeScript types
// ============================================================

export type IncidentCategory =
  | 'LIGHTING' | 'HAZARD' | 'SUSPICIOUS'
  | 'VANDALISM' | 'ANTISOCIAL' | 'PARKING'
  | 'NOISE' | 'DRUG' | 'VEHICLE' | 'THEFT';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Incident {
  id: number;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  area: string;
  reportedAt: string; // ISO date string from backend
  upvotes: number;
}

export interface NewIncident {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  area: string;
  reporterEmail?: string; // stored server-side only, never returned in GET
}

export interface IncidentStats {
  totalIncidents: number;
  lightingCount: number;
  hazardCount: number;
  suspiciousCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  mostActiveArea: string;
  last24HoursCount: number;
}

export interface AIAnalysisResponse {
  analysis: string;
}

export interface AgentResponse {
  reply: string;
  mode: 'agent' | 'fallback'; // 'agent' = Claude tool-use; 'fallback' = data-driven
}

export interface PoliceIncident {
  id: string;
  category: string;       // human-readable label
  rawCategory: string;    // original Police UK slug
  latitude: number | null;
  longitude: number | null;
  streetName: string | null;
  month: string;
  outcomeStatus: string | null;
}

// Used for map filter state
export interface FilterState {
  category: IncidentCategory | 'ALL';
  severity: IncidentSeverity | 'ALL';
}

// ── Risk model ─────────────────────────────────────────────
// A single scored point in the risk grid (drives the heat-map).
export interface RiskCell {
  latitude: number;
  longitude: number;
  score: number; // 0–100
}

// Detailed risk score for one point (GET /api/risk).
export interface RiskResult {
  latitude: number;
  longitude: number;
  hour: number | null;
  score: number;
  level: string; // LOW | MODERATE | HIGH
  nearbyReports: number;
  nearbyCrimes: number;
  topFactors: string[];
  explanation: string;
}
