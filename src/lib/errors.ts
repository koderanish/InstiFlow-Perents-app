import { ApiError } from '@/api/client';
import { defaultT, type TFunction } from '@/i18n/translate';

/** Parent-friendly text for a failed request. Raw backend messages are never shown. */
export const friendlyError = (error: unknown, t: TFunction = defaultT): string => {
  if (error instanceof ApiError) {
    if (error.isNetworkError || error.isTimeout) return t('error.network');
    if (error.status === 404) return t('error.notFound');
  }
  return t('error.generic');
};

/** True when the request failed because the phone could not reach the school's server. */
export const isOffline = (error: unknown): boolean => error instanceof ApiError && (error.isNetworkError || error.isTimeout);

/**
 * The backend's own wording for a rejected form (HTTP 400 or 422), when it is a
 * short human sentence. Anything else (server errors, odd payloads) returns null,
 * so callers fall back to `friendlyError`.
 */
export const validationMessage = (error: unknown): string | null => {
  if (!(error instanceof ApiError)) return null;
  if (error.status !== 400 && error.status !== 422) return null;
  const text = error.message.trim();
  if (!text || text.length > 160 || /^Request failed with status/.test(text) || /[<>{}\n]/.test(text)) return null;
  return text;
};
