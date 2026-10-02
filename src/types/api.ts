/**
 * Shared wire types for the InstiFlow backend API.
 *
 * The InstiFlow backend wraps successful responses in a
 * `{ success, data, message? }` envelope and errors in `{ error }`.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
  /** Returned by POST /api/auth/login when the email matches several institutions. */
  requires_institution?: boolean;
}
