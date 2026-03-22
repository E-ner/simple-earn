import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Cloudinary / S3 — ready for when you move to cloud storage
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      // Allow base64-encoded proof image uploads (default is 1mb)
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig