import { ApiClient } from '../client';
import { secureTokenStorage } from '../token-storage';
import { createAuthService } from './auth.service';
import { createParentService } from './parent.service';

export const apiClient = new ApiClient({ tokens: secureTokenStorage });

export const authApi = createAuthService(apiClient);
export const parentApi = createParentService(apiClient);

export { ApiError } from '../client';
