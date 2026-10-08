import { useEffect, useState } from 'react';

import { apiClient } from '@/api/services';

/**
 * Global product release groups (staged rollout). Tab name → release group;
 * tabs without an entry are core and always visible. Unreleased modules stay
 * invisible — the backend (403 MODULE_NOT_RELEASED) is the real gate.
 */
const TAB_RELEASE_GROUP: Record<string, string> = {
  progress: 'daily_academic',
  fees: 'operations_communication',
  inbox: 'operations_communication',
};

let cached: Promise<Set<string>> | null = null;

function fetchReleased(): Promise<Set<string>> {
  if (!cached) {
    cached = (async () => {
      try {
        // The client unwraps the { success, data } envelope already.
        const list = await apiClient.get<{ key: string; released: boolean }[]>('/releases');
        if (Array.isArray(list)) {
          return new Set(list.filter((g) => g.released).map((g) => String(g.key)));
        }
      } catch {
        // fail-open: backend enforces regardless
      }
      return new Set([
        'foundation',
        'staff_payroll',
        'students_academic',
        'daily_academic',
        'operations_communication',
        'reports_advanced',
      ]);
    })();
  }
  return cached;
}

/** Released group keys, or null until loaded (render all meanwhile). */
export function useReleasedGroups(): Set<string> | null {
  const [released, setReleased] = useState<Set<string> | null>(null);
  useEffect(() => {
    let live = true;
    fetchReleased().then((s) => {
      if (live) setReleased(s);
    });
    return () => {
      live = false;
    };
  }, []);
  return released;
}

/** True when the tab may be shown. */
export function isTabReleased(tab: string, released: Set<string> | null): boolean {
  if (!released) return true;
  const group = TAB_RELEASE_GROUP[tab];
  if (!group) return true;
  return released.has(group);
}
