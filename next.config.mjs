/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  // Enable gzip/brotli compression for JS, CSS and HTML
  compress: true,
  // Remove the X-Powered-By: Next.js response header (minor security + bandwidth)
  poweredByHeader: false,
  images: {
    // Serve next-gen formats: browsers get AVIF or WebP automatically
    formats: ['image/avif', 'image/webp'],
    // Allow local /public images to be optimized by next/image
    remotePatterns: [],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '^antadis\\..*',
            },
          ],
          destination: '/antadis/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
