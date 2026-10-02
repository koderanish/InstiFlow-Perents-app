import { SCHOOL } from '@/config/school';
import type { AuthUser, LoginCredentials, LoginResponse, TokenPair } from '@/types/auth';
import type { ApiClient } from '../client';

/**
 * The school code is compiled into the app, so parents never type it.
 * It is always sent so an email shared across schools signs into the right one.
 */
export function createAuthService(client: ApiClient) {
  return {
    login(credentials: LoginCredentials): Promise<LoginResponse> {
      return client.post<LoginResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        school_code: SCHOOL.code,
      });
    },
    logout(): Promise<void> {
      return client.post<void>('/auth/logout', undefined, { skipAuthRefresh: true });
    },
    me(): Promise<AuthUser> {
      return client.get<AuthUser>('/auth/me');
    },
    refresh(refreshToken: string): Promise<TokenPair> {
      return client.post<TokenPair>('/auth/refresh', { refreshToken }, { auth: false, skipAuthRefresh: true });
    },
  };
}
