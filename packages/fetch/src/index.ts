import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

export type CreateHttpClientOptions = {
  baseUrl: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
};

export type HttpClient = {
  fetch: <T = unknown>(
    input: RequestInfo | URL,
    init?: RequestInit
  ) => Promise<AxiosResponse<T>>;
  axiosInstance: AxiosInstance;
  abortAll: () => void;
};

const generateSecureToken = (): string => crypto.randomUUID();

const handleAxiosError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    throw new TypeError(`Failed to fetch: ${error.message || 'Unknown error'}`);
  }
  throw error;
};

/**
 * Create an HTTP client with axios backend
 *
 * @param options - Configuration options for the HTTP client
 * @returns HttpClient instance with fetch, axiosInstance, and abortAll methods
 *
 * @example
 * ```ts
 * // Basic usage
 * const client = createHttpClient({
 *   baseUrl: 'https://api.example.com',
 * });
 *
 * // With custom headers and credentials
 * const client = createHttpClient({
 *   baseUrl: 'https://api.example.com',
 *   headers: {
 *     'Authorization': 'Bearer token',
 *     'X-Custom-Header': 'value',
 *   },
 *   withCredentials: false,
 * });
 *
 * // Fetch with typed response
 * type User = { id: string; name: string; email: string };
 * const res = await client.fetch<User>('/users/1');
 * console.log(res.data.name);   // typed as string
 * console.log(res.status);      // 200
 *
 * // POST request
 * const res = await client.fetch<User>('/users', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'John' }),
 * });
 *
 * // Abort all pending requests
 * client.abortAll();
 * ```
 */
export function createHttpClient(options: CreateHttpClientOptions): HttpClient {
  const {
    baseUrl,
    headers: defaultHeaders = {},
    withCredentials = true,
  } = options;

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: defaultHeaders,
    withCredentials,
  });

  const abortControllers = new Map<string, AbortController>();

  const customFetch = async <T = unknown>(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<AxiosResponse<T>> => {
    const { headers, method, body, signal } = init ?? {};
    const requestId = generateSecureToken();
    const controller = new AbortController();
    abortControllers.set(requestId, controller);

    const abortHandler = () => controller.abort();
    signal?.addEventListener('abort', abortHandler);

    try {
      const res = await axiosInstance<T>(String(input), {
        method: method || 'GET',
        headers: headers as Record<string, string>,
        data: body,
        signal: controller.signal,
      });
      return res;
    } catch (error) {
      throw handleAxiosError(error);
    } finally {
      signal?.removeEventListener('abort', abortHandler);
      abortControllers.delete(requestId);
    }
  };

  return {
    fetch: customFetch,
    axiosInstance,
    abortAll: () => {
      for (const c of abortControllers.values()) {
        c.abort();
      }
      abortControllers.clear();
    },
  };
}
