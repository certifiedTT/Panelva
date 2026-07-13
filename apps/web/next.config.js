/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@panelva/db", "@panelva/api", "@panelva/ui"],
};

module.exports = nextConfig;
