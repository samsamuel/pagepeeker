/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://nginx/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
