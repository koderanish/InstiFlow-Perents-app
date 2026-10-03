/** Pure logic for the parent-school chat: validation, optimistic merge, day grouping. */

export const MESSAGE_MAX = 2000;
/** Show the character counter once this few characters are left. */
export const COUNTER_AT = 200;
/** A server copy of a message we are still sending is matched within this window. */
const MATCH_WINDOW_MS = 120_000;

export type Sender = 'parent' | 'school';

export type ChatMessage = {
  id: string;
  body: string;
  sender: Sender;
  senderName: string | null;
  createdAt: string;
  readAt: string | null;
};

export type MessagesData = {
  conversationId: string | null;
  messages: ChatMessage[];
  unreadCount: number;
};

export type PendingStatus = 'sending' | 'failed';

export type PendingMessage = {
  localId: string;
  body: string;
  createdAt: string;
  status: PendingStatus;
  /** Sent with every attempt so the server can drop a duplicate if a retry races the first send. */
  clientId: string;
  /** The child selected when the message was first sent; a retry uses the same one. */
  studentId: number | null;
};

export type ItemStatus = 'sent' | PendingStatus;

/** One bubble, whether it came from the server or is still on this phone. */
export type ThreadItem = {
  key: string;
  body: string;
  sender: Sender;
  senderName: string | null;
  createdAt: string;
  readAt: string | null;
  status: ItemStatus;
  /** Set for items that exist only locally (sending or failed). */
  localId: string | null;
};

export type ChatRow = { type: 'message'; key: string; item: ThreadItem } | { type: 'day'; key: string; iso: string };

export type ValidMessage = { ok: true; body: string } | { ok: false; reason: 'empty' | 'too_long' };

export const validateMessage = (raw: string): ValidMessage => {
  const body = raw.trim();
  if (body.length === 0) return { ok: false, reason: 'empty' };
  if (body.length > MESSAGE_MAX) return { ok: false, reason: 'too_long' };
  return { ok: true, body };
};

const timeOf = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
};

let localCounter = 0;
export const makeLocalId = (now: number = Date.now()): string => {
  localCounter += 1;
  return `local-${now}-${localCounter}`;
};

/** Add a message to the cached conversation without duplicating it (a poll may have delivered it already). */
export const appendMessage = (data: MessagesData | undefined, message: ChatMessage): MessagesData => {
  if (!data) return { conversationId: null, messages: [message], unreadCount: 0 };
  if (data.messages.some((m) => m.id === message.id)) return data;
  return { ...data, messages: [...data.messages, message] };
};

export const clearUnread = (data: MessagesData | undefined): MessagesData | undefined => (data ? { ...data, unreadCount: 0 } : data);

/**
 * Server messages plus local pending ones, newest first (the order an inverted list wants).
 * A sending message the server already returned (a poll landed before the send response) is dropped.
 */
export const buildThread = (server: readonly ChatMessage[], pending: readonly PendingMessage[]): ThreadItem[] => {
  const seen = new Set<string>();
  const unique = server.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  const claimed = new Set<string>();

  const stillLocal = pending.filter((p) => {
    if (p.status !== 'sending') return true;
    const sentAt = timeOf(p.createdAt);
    const twin = unique.find(
      (m) => m.sender === 'parent' && !claimed.has(m.id) && m.body.trim() === p.body.trim() && timeOf(m.createdAt) >= sentAt - MATCH_WINDOW_MS,
    );
    if (twin) claimed.add(twin.id);
    return !twin;
  });

  const fromServer: ThreadItem[] = unique.map((m) => ({
    key: m.id,
    body: m.body,
    sender: m.sender,
    senderName: m.senderName,
    createdAt: m.createdAt,
    readAt: m.readAt,
    status: 'sent',
    localId: null,
  }));
  const local: ThreadItem[] = stillLocal.map((p) => ({
    key: p.localId,
    body: p.body,
    sender: 'parent',
    senderName: null,
    createdAt: p.createdAt,
    readAt: null,
    status: p.status,
    localId: p.localId,
  }));

  return [...fromServer, ...local]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => timeOf(b.item.createdAt) - timeOf(a.item.createdAt) || b.index - a.index)
    .map(({ item }) => item);
};

/** Local calendar day, so "Today" follows the parent's clock rather than UTC. */
export const dayKey = (iso: string): string => {
  const d = new Date(timeOf(iso));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Day separators go after the oldest message of each day, because the list is inverted. */
export const buildRows = (items: readonly ThreadItem[]): ChatRow[] => {
  const rows: ChatRow[] = [];
  items.forEach((item, i) => {
    rows.push({ type: 'message', key: item.key, item });
    const next = items[i + 1];
    if (!next || dayKey(next.createdAt) !== dayKey(item.createdAt)) {
      rows.push({ type: 'day', key: `day-${dayKey(item.createdAt)}`, iso: item.createdAt });
    }
  });
  return rows;
};

export type DayLabel = { kind: 'today' } | { kind: 'yesterday' } | { kind: 'date'; day: number; month: number; year: number | null };

const dayNumber = (d: Date): number => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);

export const dayLabel = (iso: string, now: Date): DayLabel => {
  const d = new Date(timeOf(iso));
  const diff = dayNumber(now) - dayNumber(d);
  if (diff === 0) return { kind: 'today' };
  if (diff === 1) return { kind: 'yesterday' };
  return { kind: 'date', day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() === now.getFullYear() ? null : d.getFullYear() };
};

/** 12-hour clock pieces; the screen adds the translated am/pm. */
export const clockParts = (iso: string): { hour: number; minute: string; pm: boolean } => {
  const d = new Date(timeOf(iso));
  const h = d.getHours();
  return { hour: h % 12 === 0 ? 12 : h % 12, minute: String(d.getMinutes()).padStart(2, '0'), pm: h >= 12 };
};

/** Characters left, shown only when close to the limit. */
export const remainingChars = (text: string): number | null => {
  const left = MESSAGE_MAX - text.length;
  return left <= COUNTER_AT ? left : null;
};
