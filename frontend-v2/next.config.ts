import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.2.13'],
  experimental: {
    // Cho phép Turbopack nhận diện đúng thư mục root frontend-v2
  }
};

export default nextConfig;

