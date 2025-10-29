'use client';

import { useHideOnScroll } from '@/hooks/use-hide-on-scroll';
import { ScrollProgressBar } from '../common/scroll-progress-bar';
import { HeaderClient, SearchPost } from './header-client';

interface HeaderWrapperProps {
  posts: SearchPost[];
}

export function HeaderWrapper({ posts }: HeaderWrapperProps) {
  const { targetRef, marginTop } = useHideOnScroll(65);

  return (
    <nav
      style={{ marginTop }}
      ref={targetRef}
      className='fixed z-40 flex w-full flex-col items-center justify-center border-b bg-background shadow-sm print:hidden'
    >
      <HeaderClient posts={posts} />
      <ScrollProgressBar />
    </nav>
  );
}
