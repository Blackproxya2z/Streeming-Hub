import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    "21.0.12.28",
    "21.0.4.86",
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "preview-chat-697886d6-c93e-46f2-ac1e-3ada7d440167.space-z.ai",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "**.wikipedia.org",
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "img.icons8.com",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
