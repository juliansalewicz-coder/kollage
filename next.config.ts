import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a production build run next to the dev server (NEXT_DIST_DIR=.next-build npm run build).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The link-preview route reads the PNG copies from disk; ship them with that server function.
  outputFileTracingIncludes: { "/og": ["./public/products/og/**"] },
};

export default nextConfig;
