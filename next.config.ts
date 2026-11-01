import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server external packages for pdfjs-dist and firebase-admin
  serverExternalPackages: ["firebase-admin", "pdfjs-dist"],
};

export default nextConfig;
