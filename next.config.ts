import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  images: {
    unoptimized: true, // 정적 빌드를 위해 이미지 최적화 비활성화
  },
};

export default withMDX(nextConfig);
