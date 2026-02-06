/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'annecreationshb.com',
        pathname: '/**', // allow all images
      },
      {
        protocol: 'https',
        hostname: 'annecreation.reesanit.com',
        pathname: '/**', // allow all images
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**', // allow all images
      },
    ],
  },
};

export default nextConfig;
