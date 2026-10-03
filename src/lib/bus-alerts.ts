import { z } from 'zod';

/** One service notice from the school about a bus route (delay, cancellation or general info). */
export type BusAlertKind = 'delay' | 'info' | 'cancelled';

export interface BusAlert {
  id: string;
  kind: BusAlertKind;
  message: string;
  /** ISO timestamp. */
  createdAt: string;
  routeName: string | null;
}

const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const text = v?.trim();
    return text ? text : null;
  });

const alertSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(String),
  // A kind this app does not know yet is shown as plain info rather than hidden.
  kind: z.string().transform((v): BusAlertKind => (v === 'delay' || v === 'cancelled' ? v : 'info')),
  message: z.string().trim().min(1),
  createdAt: z.string().refine((v) => !Number.isNaN(Date.parse(v))),
  routeName: optionalText,
});

const responseSchema = z.object({ alerts: z.array(z.unknown()) });

/** Reads GET /parent/children/:id/bus-alerts. A malformed alert is dropped; the rest are returned newest first. */
export const parseBusAlerts = (raw: unknown): BusAlert[] => {
  const outer = responseSchema.parse(raw);
  const alerts: BusAlert[] = [];
  for (const item of outer.alerts) {
    const parsed = alertSchema.safeParse(item);
    if (parsed.success) alerts.push(parsed.data);
  }
  return alerts
    .map((alert, index) => ({ alert, index }))
    .sort((a, b) => Date.parse(b.alert.createdAt) - Date.parse(a.alert.createdAt) || a.index - b.index)
    .map(({ alert }) => alert);
};

export type AlertAge = { unit: 'now' } | { unit: 'minutes' | 'hours' | 'days'; count: number };

const MINUTE_MS = 60_000;

/** How long ago an alert was posted, in whole units. A time slightly in the future counts as "now". */
export const alertAge = (iso: string, now: Date): AlertAge => {
  const elapsed = now.getTime() - Date.parse(iso);
  const minutes = Math.floor(elapsed / MINUTE_MS);
  if (Number.isNaN(minutes) || minutes < 1) return { unit: 'now' };
  if (minutes < 60) return { unit: 'minutes', count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: 'hours', count: hours };
  return { unit: 'days', count: Math.floor(hours / 24) };
};
