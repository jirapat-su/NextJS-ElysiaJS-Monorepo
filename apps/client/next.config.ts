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
};

export default nextConfig;
