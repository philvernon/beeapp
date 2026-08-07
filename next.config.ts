import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone for dev — dynamic routes need Node.js server
  // Re-add output: 'standalone' when deploying to Docker
};

export default nextConfig;
