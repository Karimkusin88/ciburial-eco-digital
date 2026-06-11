import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Disable serwist di dev mode karena Turbopack tidak support
  // Di production (Vercel), serwist aktif dengan webpack
  disable: process.env.NODE_ENV !== "production",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Matikan Vercel dev indicators
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pfqgypeidebcmapxnrib.supabase.co',
      },
    ],
  },
};

export default withSerwist(nextConfig);
