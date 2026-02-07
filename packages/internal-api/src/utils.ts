import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
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
  refreshTokenEndpoint?: string;
};

export type ServerApiClientOptions = {
  baseUrl: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  /** Function to get cookies for server-side requests (Next.js cookies()) */
  getCookies?: () => Promise<string> | string;
  refreshTokenEndpoint?: string;
};

/** Setup auth interceptors for axios instance (client-side with cookie-based auth) */
export function setupClientAuthInterceptors(
  axiosInstance: AxiosInstance,
  options: {
    baseUrl: string;
    refreshTokenEndpoint: string;
  }
): void {
  const { baseUrl, refreshTokenEndpoint } = options;
  let refreshPromise: Promise<void> | null = null;

  const handleRefreshToken = async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as AxiosRequestConfig & {
      _isRetry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      originalRequest._isRetry ||
      originalRequest.url?.includes(refreshTokenEndpoint)
    ) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          await axios.post(`${baseUrl}${refreshTokenEndpoint}`, undefined, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          });
        } finally {
          refreshPromise = null;
        }
      })();
    }

    try {
      await refreshPromise;
      originalRequest._isRetry = true;
      return axiosInstance(originalRequest);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  axiosInstance.interceptors.response.use(r => r, handleRefreshToken);
}

/** Setup auth interceptors for axios instance (server-side with cookie-based auth) */
export function setupServerAuthInterceptors(
  axiosInstance: AxiosInstance,
  options: {
    baseUrl: string;
    getCookies?: () => Promise<string> | string;
    refreshTokenEndpoint: string;
  }
): void {
  const { baseUrl, getCookies, refreshTokenEndpoint } = options;
  let refreshPromise: Promise<void> | null = null;

  const addCookiesToRequest = async (config: InternalAxiosRequestConfig) => {
    if (getCookies) {
      const cookieHeader = await getCookies();
      if (cookieHeader) {
        config.headers.Cookie = cookieHeader;
      }
    }
    return config;
  };

  const handleRefreshToken = async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as AxiosRequestConfig & {
      _isRetry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      originalRequest._isRetry ||
      originalRequest.url?.includes(refreshTokenEndpoint)
    ) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const cookieHeader = getCookies ? await getCookies() : '';

          await axios.post(`${baseUrl}${refreshTokenEndpoint}`, undefined, {
            headers: {
              'Content-Type': 'application/json',
              ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            },
            withCredentials: true,
          });
        } finally {
          refreshPromise = null;
        }
      })();
    }

    try {
      await refreshPromise;
      originalRequest._isRetry = true;
      return axiosInstance(originalRequest);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  axiosInstance.interceptors.request.use(
    config => addCookiesToRequest(config),
    e => Promise.reject(e)
  );
  axiosInstance.interceptors.response.use(r => r, handleRefreshToken);
}
