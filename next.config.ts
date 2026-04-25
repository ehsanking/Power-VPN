import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ais-dev-djuz5srq5fhbjrh4wi4udy-57167858421.europe-west2.run.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
