import {
  appendMessage,
  buildRows,
  buildThread,
  clearUnread,
  clockParts,
  dayKey,
  dayLabel,
  MESSAGE_MAX,
  remainingChars,
  validateMessage,
  type ChatMessage,
  type MessagesData,
  type PendingMessage,
} from '../messages';

const at = (y: number, mo: number, d: number, h = 10, mi = 0) => new Date(y, mo - 1, d, h, mi).toISOString();

const msg = (id: string, createdAt: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  body: `body ${id}`,
  sender: 'school',
  senderName: 'Office',
  createdAt,
  readAt: null,
  ...over,
});

const pend = (localId: string, createdAt: string, over: Partial<PendingMessage> = {}): PendingMessage => ({
  localId,
  body: `body ${localId}`,
  createdAt,
  status: 'sending',
  ...over,
});

describe('validateMessage', () => {
  it('trims and accepts normal text', () => {
    expect(validateMessage('  hello  ')).toEqual({ ok: true, body: 'hello' });
  });
  it('rejects blank input', () => {
    expect(validateMessage('   \n ')).toEqual({ ok: false, reason: 'empty' });
  });
  it('rejects text over the limit but accepts exactly the limit', () => {
    expect(validateMessage('a'.repeat(MESSAGE_MAX))).toEqual({ ok: true, body: 'a'.repeat(MESSAGE_MAX) });
    expect(validateMessage('a'.repeat(MESSAGE_MAX + 1))).toEqual({ ok: false, reason: 'too_long' });
  });
});

describe('buildThread', () => {
  it('sorts newest first and keeps pending messages', () => {
    const items = buildThread([msg('a', at(2026, 10, 1)), msg('b', at(2026, 10, 3))], [pend('local-1', at(2026, 10, 2))]);
    expect(items.map((i) => i.key)).toEqual(['b', 'local-1', 'a']);
    expect(items[1]).toMatchObject({ status: 'sending', sender: 'parent', localId: 'local-1' });
  });

  it('drops duplicate server ids', () => {
    expect(buildThread([msg('a', at(2026, 10, 1)), msg('a', at(2026, 10, 1))], [])).toHaveLength(1);
  });

  it('drops a sending message the server already returned', () => {
    const sent = at(2026, 10, 3, 9, 0);
    const server = msg('s1', at(2026, 10, 3, 9, 0), { sender: 'parent', body: 'Hi', senderName: null });
    const items = buildThread([server], [pend('local-1', sent, { body: 'Hi' })]);
    expect(items.map((i) => i.key)).toEqual(['s1']);
  });

  it('matches each server copy to at most one pending message', () => {
    const t = at(2026, 10, 3, 9, 0);
    const server = msg('s1', t, { sender: 'parent', body: 'Hi' });
    const items = buildThread([server], [pend('l1', t, { body: 'Hi' }), pend('l2', t, { body: 'Hi' })]);
    expect(items).toHaveLength(2);
  });

  it('never drops a failed message', () => {
    const t = at(2026, 10, 3, 9, 0);
    const server = msg('s1', t, { sender: 'parent', body: 'Hi' });
    expect(buildThread([server], [pend('l1', t, { body: 'Hi', status: 'failed' })])).toHaveLength(2);
  });

  it('does not match an older identical message', () => {
    const old = msg('s0', at(2026, 10, 1), { sender: 'parent', body: 'Hi' });
    const items = buildThread([old], [pend('l1', at(2026, 10, 3), { body: 'Hi' })]);
    expect(items).toHaveLength(2);
  });
});

describe('buildRows', () => {
  it('puts a day separator after the oldest message of each day', () => {
    const items = buildThread([msg('a', at(2026, 10, 2, 9)), msg('b', at(2026, 10, 3, 8)), msg('c', at(2026, 10, 3, 12))], []);
    expect(buildRows(items).map((r) => r.key)).toEqual(['c', 'b', 'day-2026-10-03', 'a', 'day-2026-10-02']);
  });

  it('is empty for no messages', () => {
    expect(buildRows([])).toEqual([]);
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 9, 3, 15, 0);
  it('names today and yesterday', () => {
    expect(dayLabel(at(2026, 10, 3, 1), now)).toEqual({ kind: 'today' });
    expect(dayLabel(at(2026, 10, 2, 23), now)).toEqual({ kind: 'yesterday' });
  });
  it('omits the year in the current year only', () => {
    expect(dayLabel(at(2026, 9, 20), now)).toEqual({ kind: 'date', day: 20, month: 9, year: null });
    expect(dayLabel(at(2025, 12, 31), now)).toEqual({ kind: 'date', day: 31, month: 12, year: 2025 });
  });
  it('handles month boundaries for yesterday', () => {
    expect(dayLabel(at(2026, 9, 30), new Date(2026, 9, 1, 8))).toEqual({ kind: 'yesterday' });
  });
});

describe('clockParts and dayKey', () => {
  it('formats a 12-hour clock', () => {
    expect(clockParts(at(2026, 10, 3, 0, 5))).toEqual({ hour: 12, minute: '05', pm: false });
    expect(clockParts(at(2026, 10, 3, 12, 30))).toEqual({ hour: 12, minute: '30', pm: true });
    expect(clockParts(at(2026, 10, 3, 15, 9))).toEqual({ hour: 3, minute: '09', pm: true });
  });
  it('builds a local day key', () => {
    expect(dayKey(at(2026, 1, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('cache helpers', () => {
  const base: MessagesData = { conversationId: 'c1', messages: [msg('a', at(2026, 10, 1))], unreadCount: 2 };
  it('appends once', () => {
    const added = appendMessage(base, msg('b', at(2026, 10, 2)));
    expect(added.messages.map((m) => m.id)).toEqual(['a', 'b']);
    expect(appendMessage(added, msg('b', at(2026, 10, 2)))).toBe(added);
  });
  it('creates a conversation when there was none cached', () => {
    expect(appendMessage(undefined, msg('a', at(2026, 10, 1))).messages).toHaveLength(1);
  });
  it('clears the unread count', () => {
    expect(clearUnread(base)?.unreadCount).toBe(0);
    expect(clearUnread(undefined)).toBeUndefined();
  });
});

describe('remainingChars', () => {
  it('only shows near the limit', () => {
    expect(remainingChars('hello')).toBeNull();
    expect(remainingChars('a'.repeat(MESSAGE_MAX - 10))).toBe(10);
  });
});
