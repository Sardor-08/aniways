import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
      },
      {
        protocol: "https",
        hostname: "i.animepahe.ru",
      },
       {
        protocol: "https",
        hostname: "i.animepahe.si",
      },
    ],
  },
};

export default nextConfig;
