/**
 * Authentication wire types. Mirrors the InstiFlow backend:
 * POST /api/auth/login -> { user, token, refreshToken }
 */
export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  roles: string[];
  institution_id: number | null;
}

export interface TokenPair {
  token: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export const PARENT_ROLE = 'parent';

export const hasParentRole = (user: AuthUser | null): boolean => user?.roles.includes(PARENT_ROLE) ?? false;
