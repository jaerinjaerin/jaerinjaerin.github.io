'use client';

import { Ssgoi } from '@ssgoi/react';
import {
  scroll,
  fade,
  drill,
  pinterest,
  blind,
} from '@ssgoi/react/view-transitions';

const ssgoiConfig = {
  transitions: [
    // // 홈 → 소개: 위로 스크롤
    // { from: '/', to: '/about', transition: scroll({ direction: 'up' }) },
    // // 소개 → 홈: 아래로 스크롤
    // { from: '/about', to: '/', transition: scroll({ direction: 'down' }) },
    // 목록 → 상세: 드릴 (진입)
    {
      from: '/',
      to: '/blog/*',
      transition: fade(),
    },
    {
      from: '/?category=CSS',
      to: '/?category=Algorithm',
      transition: scroll({ direction: 'up' }),
      symmetric: true, // 뒤로가기 시 자동으로 down
    },
    // {
    //   from: '/docs/getting-started',
    //   to: '/docs/api',
    //   transition: scroll({ direction: 'up' }),
    //   symmetric: true,
    // },
  ],
};

export function SsgoiProvider({ children }: { children: React.ReactNode }) {
  return <Ssgoi config={ssgoiConfig}>{children}</Ssgoi>;
}
