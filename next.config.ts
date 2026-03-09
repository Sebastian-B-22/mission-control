import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable aggressive caching for API routes and dynamic pages
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
