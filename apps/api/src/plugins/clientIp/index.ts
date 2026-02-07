import Elysia from 'elysia';
import z from 'zod';

const ipv4Schema = z
  .string()
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Invalid IPv4 address'
  );

const ipv6Schema = z
  .string()
  .regex(
    /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/,
    'Invalid IPv6 address'
  );

const ipAddressSchema = z.union([ipv4Schema, ipv6Schema]);

const isValidIpAddress = (ip: string): boolean => {
  return ipAddressSchema.safeParse(ip).success;
};

/**
 * Check if IP address is in private/local range
 * @param ip - IP address string (IPv4 or IPv6)
 * @returns true if IP is private/local (10.x, 192.168.x, 172.16-31.x, 127.x, ::1, fc/fd, fe80)
 */
const isPrivateIp = (ip: string): boolean => {
  if (ip.startsWith('10.')) {
    return true;
  }
  if (ip.startsWith('192.168.')) {
    return true;
  }
  if (ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
    return true;
  }
  if (ip.startsWith('127.')) {
    return true;
  }
  if (ip.startsWith('169.254.')) {
    return true;
  }
  if (ip.startsWith('::1')) {
    return true;
  }
  if (ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
    return true;
  }
  if (ip.startsWith('fe80:')) {
    return true;
  }
  return false;
};

/**
 * Get header value from Headers object or Record
 * @param headers - Headers object or Record
 * @param key - Header name
 * @returns Header value or undefined
 */
const getHeader = (
  headers: Headers | Record<string, string | string[] | undefined>,
  key: string
): string | undefined => {
  if (headers instanceof Headers) {
    return headers.get(key) ?? undefined;
  }
  const value = headers[key];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * Headers used by proxies/load balancers to pass real client IP
 * Ordered by preference for Cloudflare + Railway deployment
 */
const IP_HEADERS = [
  'cf-connecting-ip',
  'x-forwarded-for',
  'x-real-ip',
  'x-client-ip',
  'true-client-ip',
  'x-original-forwarded-for',
  'fastly-client-ip',
  'x-cluster-client-ip',
  'x-forwarded',
  'forwarded-for',
  'forwarded',
  'appengine-user-ip',
  'cf-pseudo-ipv4',
  'fly-client-ip',
] as const;

const extractPublicIp = (
  headers: Headers | Record<string, string | string[] | undefined>
): string | undefined => {
  for (const headerName of IP_HEADERS) {
    const value = getHeader(headers, headerName);
    if (value) {
      const ips = value.split(',').map(ip => ip.trim());
      for (const ip of ips) {
        if (ip && isValidIpAddress(ip) && !isPrivateIp(ip)) {
          return ip;
        }
      }
    }
  }
  return undefined;
};

const extractAnyValidIp = (
  headers: Headers | Record<string, string | string[] | undefined>
): string | undefined => {
  for (const headerName of IP_HEADERS) {
    const value = getHeader(headers, headerName);
    if (value) {
      const ips = value.split(',').map(ip => ip.trim());
      for (const ip of ips) {
        if (ip && isValidIpAddress(ip)) {
          return ip;
        }
      }
    }
  }
  return undefined;
};

/**
 * Extract client IP address from headers with security considerations
 * Optimized for Cloudflare + Railway deployment
 * @param headers - Request headers
 * @returns Client IP address or undefined
 */
const extractClientIpAddress = (
  headers: Headers | Record<string, string | string[] | undefined> | undefined
): string | undefined => {
  if (!headers) {
    return undefined;
  }

  const publicIp = extractPublicIp(headers);
  if (publicIp) {
    return publicIp;
  }

  return extractAnyValidIp(headers);
};

/**
 * Normalize IP address to consistent format
 * - Converts IPv4-mapped IPv6 (::ffff:127.0.0.1) to IPv4 (127.0.0.1)
 * - Normalizes localhost variants to 127.0.0.1
 * @param ip - IP address string
 * @returns Normalized IP address
 */
const normalizeIpAddress = (ip: string): string => {
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  if (ip === '::1' || ip === '::') {
    return '127.0.0.1';
  }
  return ip;
};

export const clientIpPlugin = new Elysia({
  name: 'client-ip-plugin',
})
  .derive(({ request, server }) => {
    const extractIpAddress = extractClientIpAddress(request.headers) ?? '';
    const rawIp = server?.requestIP(request)?.address || extractIpAddress;
    const clientIpAddress = normalizeIpAddress(rawIp);
    return { clientIpAddress };
  })
  .as('scoped');
