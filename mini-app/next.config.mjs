/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许构建时有 ESLint 警告但不阻断（实际错误仍然阴断）
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};
export default nextConfig;
