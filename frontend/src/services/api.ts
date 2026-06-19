import axios from 'axios';
import type { Incident, NewIncident, IncidentStats, AIAnalysisResponse, AgentResponse, PoliceIncident, RiskCell, RiskResult, Alert } from '../types';

// Vite proxy routes /api → http://localhost:8080 in dev
// In production, set VITE_API_URL to your deployed backend URL
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ── Incidents ──────────────────────────────────────────────

/** Fetch all incidents (optionally filtered) */
export async function fetchIncidents(
  category?: string,
  severity?: string
): Promise<Incident[]> {
  const params: Record<string, string> = {};
  if (category && category !== 'ALL') params.category = category;
  if (severity && severity !== 'ALL') params.severity = severity;

  const { data } = await api.get<Incident[]>('/incidents', { params });
  return data;
}

/** Fetch the 20 most recent incidents for the live feed */
export async function fetchRecentIncidents(): Promise<Incident[]> {
  const { data } = await api.get<Incident[]>('/incidents/recent');
  return data;
}

/** Submit a new incident report */
export async function createIncident(incident: NewIncident): Promise<Incident> {
  const { data } = await api.post<Incident>('/incidents', incident);
  return data;
}

/** Upvote an incident — confirm it's still active */
export async function upvoteIncident(id: number): Promise<Incident> {
  const { data } = await api.patch<Incident>(`/incidents/${id}/upvote`);
  return data;
}

/** Fetch analytics stats for the dashboard */
export async function fetchStats(): Promise<IncidentStats> {
  const { data } = await api.get<IncidentStats>('/incidents/analytics');
  return data;
}

// ── AI ────────────────────────────────────────────────────

/** Send a route/area description to the AI safety analyser (single-shot, Gemini or fallback) */
export async function analyseWithAI(prompt: string): Promise<AIAnalysisResponse> {
  const { data } = await api.post<AIAnalysisResponse>('/ai/analyse', { prompt });
  return data;
}

/**
 * Ask the StreetPulse AI agent. When an Anthropic key is configured this is a Claude
 * agent that uses tools to query real data; otherwise it returns the data-driven fallback.
 */
export async function chatWithAgent(message: string): Promise<AgentResponse> {
  const { data } = await api.post<AgentResponse>('/ai/agent', { message }, { timeout: 60000 });
  return data;
}

// ── Police UK ────────────────────────────────────────────

/** Fetch recent Police UK crime data for Uxbridge area */
export async function fetchPoliceCrimes(): Promise<PoliceIncident[]> {
  const { data } = await api.get<PoliceIncident[]>('/police/crimes/recent');
  return data;
}

// ── Alerts ─────────────────────────────────────────────────

/** Fetch the live alerts feed (recent high-priority activity). */
export async function fetchAlerts(): Promise<Alert[]> {
  const { data } = await api.get<Alert[]>('/alerts');
  return data;
}

// ── Auth (real accounts, hashed passwords) ─────────────────

export interface AuthUser { name: string; email: string; }

export async function registerUser(name: string, email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/register', { name, email, password });
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/login', { email, password });
  return data;
}

/** Pull a friendly message out of an axios error from the auth endpoints. */
export function authErrorMessage(e: unknown): string {
  const ax = e as { response?: { data?: { error?: string } }; message?: string };
  if (ax?.response?.data?.error) return ax.response.data.error;
  return 'Could not reach the server. Is the backend running on port 8080?';
}

// ── Risk model ────────────────────────────────────────────

/** Fetch the risk grid for the heat-map, optionally for a given hour of day (0–23). */
export async function fetchRiskGrid(hour?: number): Promise<RiskCell[]> {
  const params: Record<string, number> = {};
  if (hour != null) params.hour = hour;
  const { data } = await api.get<RiskCell[]>('/risk/grid', { params });
  return data;
}

/** Fetch a detailed, explainable risk score for a single point and optional hour. */
export async function fetchRiskAt(lat: number, lng: number, hour?: number): Promise<RiskResult> {
  const params: Record<string, number> = { lat, lng };
  if (hour != null) params.hour = hour;
  const { data } = await api.get<RiskResult>('/risk', { params });
  return data;
}
