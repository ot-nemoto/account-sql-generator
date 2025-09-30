import type { NextConfig } from "next";

const isStatic = process.env.BUILD_MODE === "static";

const nextConfig: NextConfig = {
  ...(isStatic && {
    output: "export",
    trailingSlash: true,
    basePath: "/account-sql-generator",
    assetPrefix: "/account-sql-generator",
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
