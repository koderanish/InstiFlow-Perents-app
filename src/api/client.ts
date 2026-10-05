import { env } from '@/config/env';
import type { ApiEnvelope, ApiErrorBody } from '@/types/api';
import type { TokenPair } from '@/types/auth';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export type ApiErrorCode =
  | 'network_error'
  | 'timeout'
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation_error'
  | 'rate_limited'
  | 'server_error'
  | 'unknown';

const DEFAULT_TIMEOUT_MS = 30_000;

function codeForStatus(status: number): ApiErrorCode {
  if (status === 0) return 'network_error';
  if (status === 400) return 'bad_request';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'validation_error';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'unknown';
}

/**
 * Normalized error thrown for every failed API exchange.
 * UI layers translate this into parent-friendly copy;
 * raw backend messages must not be rendered directly.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly requiresInstitution: boolean;

  constructor(
    status: number,
    message: string,
    options?: { code?: ApiErrorCode; requiresInstitution?: boolean },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code ?? codeForStatus(status);
    this.requiresInstitution = options?.requiresInstitution ?? false;
  }

  get isNetworkError(): boolean {
    return this.code === 'network_error';
  }

  get isTimeout(): boolean {
    return this.code === 'timeout';
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get canRetry(): boolean {
    return this.isNetworkError || this.isTimeout || this.status === 429 || this.status >= 500;
  }
}

/**
 * Abstraction over credential storage, implemented with expo-secure-store in
 * production. The API client never knows where tokens live and never logs them.
 */
export interface SessionTokenProvider {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  storeTokens(tokens: TokenPair): Promise<void>;
  clearTokens(): Promise<void>;
}

export interface RequestOptions {
  path: string;
  method?: HttpMethod;
  query?: QueryParams;
  body?: unknown;
  timeoutMs?: number;
  /** External cancellation signal (e.g. TanStack Query cancellation). */
  signal?: AbortSignal;
  /** Attach the access token. Defaults to true. */
  auth?: boolean;
  /**
   * Skip the automatic refresh-and-retry on 401. Required for the refresh
   * endpoint itself to avoid infinite loops.
   */
  skipAuthRefresh?: boolean;
}

export interface ApiClientOptions {
  baseUrl?: string;
  tokens: SessionTokenProvider;
  timeoutMs?: number;
  /** Called when a session cannot be restored (refresh failed with no token). */
  onSessionExpired?: () => void;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokens: SessionTokenProvider;
  private readonly defaultTimeoutMs: number;
  private onSessionExpired?: () => void;
  private refreshInFlight: Promise<TokenPair> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = (options.baseUrl ?? env.apiUrl).replace(/\/+$/, '');
    this.tokens = options.tokens;
    this.defaultTimeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.onSessionExpired = options.onSessionExpired;
  }

  setSessionExpiredHandler(handler: () => void): void {
    this.onSessionExpired = handler;
  }

  get<T>(path: string, query?: QueryParams, options?: Partial<RequestOptions>): Promise<T | undefined> {
    return this.request<T>({ ...options, path, query, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ ...options, path, body, method: 'POST' });
  }

  put<T>(path: string, body?: unknown, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ ...options, path, body, method: 'PUT' });
  }

  patch<T>(path: string, body?: unknown, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ ...options, path, body, method: 'PATCH' });
  }

  delete<T>(path: string, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ ...options, path, method: 'DELETE' });
  }

  /** Executes a request, handling 401 via single-flight refresh and one retry. */
  async request<T>(options: RequestOptions): Promise<T> {
    const attachAuth = options.auth ?? true;

    let response = await this.execute(options, attachAuth);

    if (response.status === 401 && attachAuth && !options.skipAuthRefresh) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        response = await this.execute(options, attachAuth);
      } else {
        throw new ApiError(401, 'Your session has expired. Please sign in again.');
      }
    }

    // A 304 on GET means "use what you have": conditional revalidation answered
    // with no body. It is a success, not an error — callers treat missing data
    // with their `??` fallbacks instead of showing an error screen.
    if (response.status === 304 && (options.method ?? 'GET') === 'GET') {
      return undefined as T;
    }

    return this.parse<T>(response);
  }

  private async execute(options: RequestOptions, attachAuth: boolean): Promise<Response> {
    const url = this.buildUrl(options.path, options.query);
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (attachAuth) {
      const accessToken = await this.tokens.getAccessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      return await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      if (options.signal?.aborted) {
        // External cancellation: surface as-is so callers (TanStack Query) can detect it.
        throw error;
      }
      if (controller.signal.aborted) {
        throw new ApiError(0, 'The request timed out. Please try again.', { code: 'timeout' });
      }
      throw new ApiError(
        0,
        'You appear to be offline. Check your connection and try again.',
        { code: 'network_error' },
      );
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onExternalAbort);
    }
  }

  private buildUrl(path: string, query?: QueryParams): string {
    let url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    if (query) {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) search.append(key, String(value));
      }
      const queryString = search.toString();
      if (queryString) url += `?${queryString}`;
    }
    return url;
  }

  /**
   * Single-flight token refresh against POST /api/auth/refresh. Concurrent 401s
   * share one refresh; the backend rotates refresh tokens, so the stored pair
   * is always replaced atomically.
   */
  private async tryRefresh(): Promise<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.doRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }
    try {
      await this.refreshInFlight;
      return true;
    } catch {
      return false;
    }
  }

  private async doRefresh(): Promise<TokenPair> {
    const refreshToken = await this.tokens.getRefreshToken();
    if (!refreshToken) {
      await this.tokens.clearTokens();
      this.onSessionExpired?.();
      throw new ApiError(401, 'No active session.');
    }

    try {
      const response = await this.execute(
        { path: '/auth/refresh', method: 'POST', body: { refreshToken }, skipAuthRefresh: true },
        false,
      );
      if (!response.ok) {
        await this.tokens.clearTokens();
        this.onSessionExpired?.();
        throw new ApiError(401, 'Your session has expired. Please sign in again.');
      }
      const json = (await response.json()) as ApiEnvelope<TokenPair>;
      if (!json?.data?.token || !json?.data?.refreshToken) {
        await this.tokens.clearTokens();
        this.onSessionExpired?.();
        throw new ApiError(401, 'Your session has expired. Please sign in again.');
      }
      await this.tokens.storeTokens(json.data);
      return json.data;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        // Network failure during refresh: keep tokens, let the caller retry later.
        if (error instanceof ApiError && (error.isNetworkError || error.isTimeout)) throw error;
        await this.tokens.clearTokens();
        this.onSessionExpired?.();
      }
      throw error instanceof Error ? error : new ApiError(401, 'Session refresh failed.');
    }
  }

  /** Reads the body once, normalizes errors, and unwraps the success envelope. */
  private async parse<T>(response: Response): Promise<T> {
    const text = await response.text();
    let json: unknown;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
    }

    if (!response.ok) {
      const body = (json ?? {}) as ApiErrorBody;
      const rawMessage =
        typeof body.error === 'string' && body.error
          ? body.error
          : typeof body.message === 'string' && body.message
            ? body.message
            : `Request failed with status ${response.status}`;
      throw new ApiError(response.status, rawMessage, {
        requiresInstitution: body.requires_institution === true,
      });
    }

    if (json !== null && typeof json === 'object' && 'data' in (json as Record<string, unknown>)) {
      return (json as ApiEnvelope<T>).data;
    }

    return json as T;
  }
}
