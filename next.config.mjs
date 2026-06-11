import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Disable serwist di dev mode — tidak support Turbopack
  disable: process.env.NODE_ENV !== "production",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Matikan Vercel dev indicators
  devIndicators: false,
  // Tambah empty turbopack config supaya Next.js 16 tidak complaint
  turbopack: {},
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
