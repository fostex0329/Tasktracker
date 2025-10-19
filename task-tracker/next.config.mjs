/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Use standalone ESLint step (npm run lint) instead of Next.js invoking it during builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
