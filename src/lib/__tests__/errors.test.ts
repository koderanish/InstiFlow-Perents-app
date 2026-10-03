import { ApiError } from '@/api/client';

import { friendlyError, isOffline, validationMessage } from '../errors';

describe('errors', () => {
  it('shows a safe message for failures', () => {
    expect(friendlyError(new ApiError(0, 'x', { code: 'network_error' }))).toMatch(/internet/);
    expect(friendlyError(new ApiError(500, 'boom'))).toMatch(/our side/);
  });

  it('detects offline', () => {
    expect(isOffline(new ApiError(0, 'x', { code: 'network_error' }))).toBe(true);
    expect(isOffline(new ApiError(0, 'x', { code: 'timeout' }))).toBe(true);
    expect(isOffline(new ApiError(500, 'x'))).toBe(false);
    expect(isOffline(new Error('x'))).toBe(false);
  });

  it('passes through short 400 validation text only', () => {
    expect(validationMessage(new ApiError(400, 'Incorrect current password'))).toBe('Incorrect current password');
    expect(validationMessage(new ApiError(422, 'Please pick a date'))).toBe('Please pick a date');
    expect(validationMessage(new ApiError(500, 'Internal server error'))).toBeNull();
    expect(validationMessage(new ApiError(400, 'Request failed with status 400'))).toBeNull();
    expect(validationMessage(new ApiError(400, '<html>bad</html>'))).toBeNull();
    expect(validationMessage(new ApiError(400, 'x'.repeat(200)))).toBeNull();
    expect(validationMessage(new ApiError(400, '  '))).toBeNull();
    expect(validationMessage(new Error('Incorrect'))).toBeNull();
  });
});
