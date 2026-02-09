import { treaty } from '@elysiajs/eden';
import type { ApiType } from 'api/src';
import axios from 'axios';
import { useMemo, useRef, useState } from 'react';
import {
  type ApiClientOptions,
  axiosToFetchResponse,
  generateSecureToken,
  handleAxiosError,
} from './utils';

/**
 * Client-side React hook for HTTP client with cookie-based auth
 * (better-auth handles session/refresh automatically via cookies)
 *
 * @param options - Configuration options for the API client
 * @returns Eden treaty client for type-safe API calls
 *
 * @example
 * ```tsx
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
 * ```
 */
export function useApiClient(options: ApiClientOptions) {
  const {
    baseUrl,
    headers: defaultHeaders = {},
    withCredentials = true,
  } = options;

  const [axiosInstance] = useState(() =>
    axios.create({
      baseURL: baseUrl,
      headers: defaultHeaders,
      withCredentials,
    })
  );
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

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
          // No-op: preconnect not needed
        },
      }),
    });
  }, [axiosInstance, baseUrl, defaultHeaders]);

  return apiClient;
}
