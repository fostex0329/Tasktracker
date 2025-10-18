/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript設定
  typescript: {
    // 本番ビルド時にTypeScriptエラーがある場合はビルドを停止
    ignoreBuildErrors: false,
  },
  
  // ESLint設定
  eslint: {
    // 本番ビルド時にESLintエラーがある場合はビルドを停止
    ignoreDuringBuilds: false,
  },
  
  // 実験的機能
  experimental: {
    // Server ActionsはNext.js 15ではデフォルトで有効
  },
  
  // 画像最適化
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
