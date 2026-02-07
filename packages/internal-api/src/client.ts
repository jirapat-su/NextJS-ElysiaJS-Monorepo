import { treaty } from '@elysiajs/eden';
import type { ApiType } from 'api/src';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ApiClientOptions,
  axiosToFetchResponse,
  generateSecureToken,
  handleAxiosError,
  setupClientAuthInterceptors,
} from './utils';

/**
 * Client-side React hook for HTTP client with cookie-based auth
 *
 * @param options - Configuration options for the API client
 * @returns Eden treaty client for type-safe API calls
 *
 * @example
 * ```tsx
 * // Basic usage in a React component
 * function UserProfile() {
 *   const api = useApiClient({
 *     baseUrl: 'https://api.example.com',
 *   });
 *
 *   useEffect(() => {
 *     const fetchUser = async () => {
 *       const { data } = await api.users({ id: '1' }).get();
 *       console.log(data);
 *     };
 *     fetchUser();
 *   }, [api]);
 * }
 *
 * // With custom headers and credentials
 * const api = useApiClient({
 *   baseUrl: 'https://api.example.com',
 *   headers: {
 *     'X-API-Key': 'your-api-key',
 *   },
 *   withCredentials: false,
 * });
 *
 * // With auto token refresh (cookie-based)
 * const api = useApiClient({
 *   baseUrl: 'https://api.example.com',
 *   refreshTokenEndpoint: '/auth/refresh-token',
 * });
 *
 * // Type-safe API calls with Eden
 * const { data, error } = await api.users.post({ name: 'John' });
 * ```
 */
export function useApiClient(options: ApiClientOptions) {
  const {
    baseUrl,
    headers: defaultHeaders = {},
    withCredentials = true,
    refreshTokenEndpoint = '/auth/refresh-token',
  } = options;

  const [axiosInstance] = useState(() =>
    axios.create({
      baseURL: baseUrl,
      headers: defaultHeaders,
      withCredentials,
    })
  );
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const interceptorSetupRef = useRef(false);

  const apiClient = useMemo(() => {
    const fetcher = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const { headers, method, body, signal } = init ?? {};
      const requestId = generateSecureToken();
      const controller = new AbortController();
      abortControllersRef.current.set(requestId, controller);

      const abortHandler = () => controller.abort();
      signal?.addEventListener('abort', abortHandler);

      try {
        const res = await axiosInstance(String(input), {
          method: method || 'GET',
          headers: headers as Record<string, string>,
          withCredentials: true,
          data: body,
          signal: controller.signal,
        });
        return axiosToFetchResponse(res);
      } catch (error) {
        return handleAxiosError(error);
      } finally {
        signal?.removeEventListener('abort', abortHandler);
        abortControllersRef.current.delete(requestId);
      }
    };

    return treaty<ApiType>(baseUrl, {
      headers: defaultHeaders,
      fetcher: Object.assign(fetcher, {
        preconnect: async () => {
          // No-op: preconnect not needed for this implementation
        },
      }),
    });
  }, [axiosInstance, baseUrl, defaultHeaders]);

  useEffect(() => {
    // Only setup interceptors once per axiosInstance
    if (!interceptorSetupRef.current) {
      setupClientAuthInterceptors(axiosInstance, {
        baseUrl,
        refreshTokenEndpoint,
      });
      interceptorSetupRef.current = true;
    }

    return () => {
      for (const c of abortControllersRef.current.values()) {
        c.abort();
      }
      abortControllersRef.current.clear();
    };
  }, [axiosInstance, baseUrl, refreshTokenEndpoint]);

  return apiClient;
}

export type { ApiClientOptions };
