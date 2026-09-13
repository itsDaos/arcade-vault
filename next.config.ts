import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.50.34', '192.168.0.191'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
