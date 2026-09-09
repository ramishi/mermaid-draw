import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('./package.json') as { version: string }

const nextConfig: NextConfig = {
  output: 'export',       // generates out/ directory
  trailingSlash: true,    // each route → /route/index.html
  basePath: process.env.BASE_PATH ?? '',
  assetPrefix: process.env.BASE_PATH ?? '',
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;
