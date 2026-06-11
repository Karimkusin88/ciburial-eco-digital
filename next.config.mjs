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

export default nextConfig;
