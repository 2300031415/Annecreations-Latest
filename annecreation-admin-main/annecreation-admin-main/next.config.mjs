/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '/admin',
  },
  images: {
   remotePatterns: [
      {
        protocol: 'https',
        hostname: 'annecreation.reesanit.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'annecreationshb.com',
        pathname: '/**', // allow all images
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: true,
        basePath: false,
      },
    ];
  },
}

export default nextConfig
