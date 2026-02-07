import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

export const axiosToFetchResponse = <T>(res: AxiosResponse<T>): Response => {
  const body = JSON.stringify(res.data);
  const contentType = res.headers['content-type'] || 'application/json';

  const headers = new Headers();
  for (const [key, value] of Object.entries(res.headers)) {
    if (value != null) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
    }
  }
  headers.set('content-type', contentType);

  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
};

export const handleAxiosError = (error: unknown): Response => {
  if (axios.isAxiosError(error) && error.response) {
    return axiosToFetchResponse(error.response);
  }
  if (axios.isAxiosError(error)) {
    throw new TypeError(`Failed to fetch: ${error.message || 'Unknown error'}`);
  }
  throw error;
};

export const generateSecureToken = (): string => crypto.randomUUID();

export type ApiClientOptions = {
  baseUrl: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
};

export type ServerApiClientOptions = {
  baseUrl: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  /** Function to get cookies for server-side requests (Next.js cookies()) */
  getCookies?: () => Promise<string> | string;
};

/**
 * Setup cookie forwarding interceptor for server-side axios
 * (forwards Next.js cookies to backend)
 */
export function setupServerCookieInterceptor(
  axiosInstance: AxiosInstance,
  getCookies?: () => Promise<string> | string
): void {
  if (!getCookies) {
    return;
  }

  const addCookiesToRequest = async (config: InternalAxiosRequestConfig) => {
    const cookieHeader = await getCookies();
    if (cookieHeader) {
      config.headers.Cookie = cookieHeader;
    }
    return config;
  };

  axiosInstance.interceptors.request.use(
    config => addCookiesToRequest(config),
    e => Promise.reject(e)
  );
}
