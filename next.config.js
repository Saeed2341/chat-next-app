/** @type {import('next').NextConfig} */
const defaultCache = require('next-pwa/cache');

const runtimeCaching = [
  {
    urlPattern: /\/socket\.io\/.*/i,
    handler: 'NetworkOnly',
    options: {
      cacheName: 'socket-io',
    },
  },
  ...defaultCache.map((entry) => {
    if (entry.options?.cacheName === 'others') {
      return {
        ...entry,
        urlPattern: ({ url }) => {
          const isSameOrigin = self.origin === url.origin;
          if (!isSameOrigin) return false;
          if (url.pathname.startsWith('/socket.io/')) return false;
          if (url.pathname.startsWith('/api/')) return false;
          return true;
        },
      };
    }
    return entry;
  }),
];

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline.html',
  },
  publicExcludes: ['!manifest.json', '!icons/**/*'],
  runtimeCaching,
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);
