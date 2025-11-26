const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.svgrepo.com',
      },
      {
        protocol: 'https',
        hostname: 'svgrepo.com',
      },
      {
        protocol: 'https',
        hostname: 'www.vectorlogo.zone',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
