import { Match, Coach, ClubContact, MesaAssignment } from '../types/fixture';

export interface ClubDataSnapshot {
  version: number;
  updatedAt: string;
  matches: Match[];
  annualFixture: Match[];
  coaches: Coach[];
  rivalClubs: ClubContact[];
  mesaAssignments: Record<string, MesaAssignment>;
}

export const isStaticHostingEnv = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host.endsWith('github.io') || host.endsWith('pages.dev') || host.endsWith('netlify.app');
};

/**
 * Fetches the static snapshot shipped with the repository (public/data/club-data.json -> dist/data/club-data.json).
 */
export const fetchPublishedClubData = async (): Promise<ClubDataSnapshot | null> => {
  try {
    const res = await fetch(`./data/club-data.json?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
      return null;
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    return data as ClubDataSnapshot;
  } catch {
    return null;
  }
};

/**
 * Automatically saves the current club state into repository files (public/data/club-data.json & docs/data/club-data.json)
 * when running with the Express backend (AI Studio / local dev), so copying to GitHub always includes all data.
 */
export const syncClubDataToServer = async (snapshot: ClubDataSnapshot): Promise<boolean> => {
  if (isStaticHostingEnv()) return false;
  try {
    const res = await fetch('/api/club-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
};

/**
 * Downloads club-data.json so the coordinator can back up or upload it into GitHub (public/data/club-data.json).
 */
export const downloadClubDataSnapshot = (snapshot: ClubDataSnapshot) => {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'club-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
