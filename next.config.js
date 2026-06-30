/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gzip responses (the host/CDN also handles this in production).
  compress: true,
  // Don't advertise the framework version.
  poweredByHeader: false,
  // Long-cache the static testimonial / asset images (immutable content).
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
