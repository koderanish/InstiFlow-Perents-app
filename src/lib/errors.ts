import { ApiError } from '@/api/client';

/** Parent-friendly text for a failed request. Raw backend messages are never shown. */
export const friendlyError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.isNetworkError || error.isTimeout) return 'Check your internet connection and try again.';
    if (error.status === 404) return 'We could not find this. Please contact the school office.';
  }
  return 'Something went wrong on our side. Please try again in a moment.';
};
