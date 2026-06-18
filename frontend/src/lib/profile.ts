import { useEffect, useReducer } from 'react';

export interface Profile {
  name: string;
  email: string;
}

const KEY = 'sp_profile';

function load(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

let current: Profile | null = load();
const listeners = new Set<() => void>();

export function getProfile(): Profile | null {
  return current;
}

export function setProfile(p: Profile | null): void {
  current = p;
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Reactive hook — re-renders when the signed-in profile changes. */
export function useProfile(): Profile | null {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => { listeners.delete(force); };
  }, []);
  return current;
}
