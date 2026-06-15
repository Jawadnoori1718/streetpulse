import axios from 'axios';
import type { Incident, NewIncident, IncidentStats, AIAnalysisResponse, PoliceIncident } from '../types';

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

/** Send a route/area description to the AI safety analyser */
export async function analyseWithAI(prompt: string): Promise<AIAnalysisResponse> {
  const { data } = await api.post<AIAnalysisResponse>('/ai/analyse', { prompt });
  return data;
}

// ── Police UK ────────────────────────────────────────────

/** Fetch recent Police UK crime data for Uxbridge area */
export async function fetchPoliceCrimes(): Promise<PoliceIncident[]> {
  const { data } = await api.get<PoliceIncident[]>('/police/crimes/recent');
  return data;
}
