/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduces stale chunk errors during HMR (common on Windows dev paths).
      config.cache = { type: "memory" };
    }
    return config;
  },
};

module.exports = nextConfig;
