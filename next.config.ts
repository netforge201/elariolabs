import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/terms', destination: '/legal/terms-of-use', permanent: true },
      { source: '/privacy-policy', destination: '/legal/privacy-policy', permanent: true },
      { source: '/privacy', destination: '/legal/privacy-policy', permanent: true },
    ];
  },
};
export default config;
