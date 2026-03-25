import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	eslint:{ignoreDuringBuilds:true},typescript:{ignoreBuildErrors:true},
  /* config options here */
  async rewrites() {
		return [
			{
				source: '/proxy/:path*',
				destination: `http://localhost:8000/:path*`,
			},
		]
	},
};

export default nextConfig;
