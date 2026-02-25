import { treaty } from '@elysiajs/eden';
import type { ApiType } from 'api/src';
import axios, { type AxiosInstance } from 'axios';
import {
  axiosToFetchResponse,
  generateSecureToken,
  handleAxiosError,
  type ServerApiClientOptions,
  setupServerCookieInterceptor,
} from './utils';

/**
 * Server-side HTTP client using Elysia Eden with Axios
 * (better-auth handles session/refresh automatically via cookies)
 *
 * @param options - Configuration options for the API client
 * @returns Object containing client, axiosInstance, and abortAll methods
 *
 * @example
 * ```ts
 * // Basic usage
 * const { client } = createApiClient({
 *   baseUrl: 'https://api.example.com',
 * });
 *
 * // With cookie-based auth (Next.js Server Component)
 * import { cookies } from 'next/headers';
 *
 * const { client } = createApiClient({
 *   baseUrl: 'https://api.example.com',
 *   getCookies: async () => (await cookies()).toString(),
 * });
 *
 * // Use Eden client for type-safe API calls
 * const { data, error } = await client.users({ id: '1' }).get();
 * ```
 */
type ApiClient = ReturnType<typeof treaty<ApiType>>;

type CreateApiClientResult = {
  client: ApiClient;
  axiosInstance: AxiosInstance;
  abortAll: () => void;
};

export function createApiClient(
  options: ServerApiClientOptions
): CreateApiClientResult {
  const {
    baseUrl,
    headers: defaultHeaders = {},
    withCredentials = true,
    getCookies,
  } = options;

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: defaultHeaders,
    withCredentials,
  });
  const abortControllers = new Map<string, AbortController>();

  setupServerCookieInterceptor(axiosInstance, getCookies);

  const fetcher = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const { headers, method, body, signal } = init ?? {};
    const requestId = generateSecureToken();
    const controller = new AbortController();
    abortControllers.set(requestId, controller);

    const abortHandler = () => controller.abort();
    signal?.addEventListener('abort', abortHandler);

    try {
      const res = await axiosInstance(String(input), {
        method: method || 'GET',
        headers: headers as Record<string, string>,
        data: body,
        signal: controller.signal,
      });
      return axiosToFetchResponse(res);
    } catch (error) {
      return handleAxiosError(error);
    } finally {
      signal?.removeEventListener('abort', abortHandler);
      abortControllers.delete(requestId);
    }
  };

  const client = treaty<ApiType>(baseUrl, {
    headers: defaultHeaders,
    fetcher: Object.assign(fetcher, {
      preconnect: async () => {
        // No-op: preconnect not needed
      },
    }),
  });

  return {
    client,
    axiosInstance,
    abortAll: () => {
      for (const c of abortControllers.values()) {
        c.abort();
      }
      abortControllers.clear();
    },
  };
}
