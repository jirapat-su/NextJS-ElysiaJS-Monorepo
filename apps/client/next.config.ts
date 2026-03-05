import type { NextConfig } from 'next';

const isStandalone = process.env.BUILD_STANDALONE === 'true';
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: isStandalone ? 'standalone' : undefined,
  reactCompiler: true,
  devIndicators: {
    position: 'bottom-right',
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  compress: true,
  compiler: {
    removeConsole: isProduction ? { exclude: ['error'] } : false,
  },
  serverExternalPackages: ['better-auth'],
  typedRoutes: true,
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'; form-action 'self';",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
