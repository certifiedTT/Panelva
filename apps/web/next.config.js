const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@panelva/db", "@panelva/api", "@panelva/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "rlzhlsrhtiffuigedkum.supabase.co",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
  webpack: (config) => {
    const rootNodeModules = path.resolve(__dirname, "../../node_modules");
    const localNodeModules = path.resolve(__dirname, "node_modules");
    config.resolve.modules = [localNodeModules, rootNodeModules, ...(config.resolve.modules || ["node_modules"])];
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "framer-motion": path.resolve(rootNodeModules, "framer-motion"),
      "lucide-react": path.resolve(rootNodeModules, "lucide-react"),
      "@tanstack/query-core": path.resolve(rootNodeModules, "@tanstack/query-core"),
      "@tanstack/react-query": path.resolve(rootNodeModules, "@tanstack/react-query"),
    };
    return config;
  },
};

module.exports = nextConfig;

