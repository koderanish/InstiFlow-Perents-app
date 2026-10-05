import { ApiClient, ApiError, type SessionTokenProvider } from '../client';

function makeTokens(): SessionTokenProvider {
  return {
    getAccessToken: jest.fn(async () => 'access-1'),
    getRefreshToken: jest.fn(async () => 'refresh-1'),
    storeTokens: jest.fn(async () => undefined),
    clearTokens: jest.fn(async () => undefined),
  };
}

describe('ApiClient 304 handling', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('treats a 304 on GET as success with no body (conditional revalidation)', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: false,
      status: 304,
      text: async () => '',
    })) as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: 'https://api.test', tokens: makeTokens() });

    await expect(client.get('/timetable')).resolves.toBeUndefined();
  });

  it('still rejects a 304 on non-GET methods', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: false,
      status: 304,
      text: async () => '',
    })) as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: 'https://api.test', tokens: makeTokens() });

    const error = await client.post('/messages/1', {}).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(304);
  });
});
