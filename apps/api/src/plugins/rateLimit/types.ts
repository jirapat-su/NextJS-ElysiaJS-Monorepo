export type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitContext = {
  ip: string;
  path: string;
  method: string;
};

export type RateLimitOptions = {
  max?: number;
  window?: number;
  message?: string;
  skip?: (ctx: RateLimitContext) => boolean | Promise<boolean>;
};
