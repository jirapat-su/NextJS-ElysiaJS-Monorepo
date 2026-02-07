import { treaty } from '@elysiajs/eden';
import type { ApiType } from 'api/src';
import axios from 'axios';
import {
  axiosToFetchResponse,
  generateSecureToken,
  handleAxiosError,
  type ServerApiClientOptions,
  setupServerAuthInterceptors,
} from './utils';

/**
 * Server-side HTTP client using Elysia Eden with Axios (supports cookie-based auth)
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
 * // With custom headers
 * const { client } = createApiClient({
 *   baseUrl: 'https://api.example.com',
 *   headers: {
 *     'X-API-Key': 'your-api-key',
 *   },
 *   withCredentials: false,
 * });
 *
 * // With cookie-based auth (Next.js Server Component)
 * import { cookies } from 'next/headers';
 *
 * const { client } = createApiClient({
 *   baseUrl: 'https://api.example.com',
 *   getCookies: async () => (await cookies()).toString(),
 *   refreshTokenEndpoint: '/auth/refresh-token',
 * });
 *
 * // Use Eden client for type-safe API calls
 * const { data, error } = await client.users({ id: '1' }).get();
 *
 * // Abort all pending requests
 * abortAll();
 * ```
 */
export function createApiClient(options: ServerApiClientOptions) {
  const {
    baseUrl,
    headers: defaultHeaders = {},
    withCredentials = true,
    getCookies,
    refreshTokenEndpoint = '/auth/refresh-token',
  } = options;

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: defaultHeaders,
    withCredentials,
  });
  const abortControllers = new Map<string, AbortController>();

  setupServerAuthInterceptors(axiosInstance, {
    baseUrl,
    getCookies,
    refreshTokenEndpoint,
  });

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
        // No-op: preconnect not needed for this implementation
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

export type { ServerApiClientOptions };
