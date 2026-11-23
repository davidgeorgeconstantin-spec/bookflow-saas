import type { NextConfig } from 'next';

// Static export for GitHub Pages: the site lives at https://<user>.github.io/bookflow-saas/
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/bookflow-saas',
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true }, // we run `npm run lint` separately
};

export default nextConfig;
