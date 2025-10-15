'use client';

import { useEffect, useState } from 'react';

export function ScrollProgressBar() {
  const [mounted, setMounted] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = () => {
    const winScroll = document.documentElement.scrollTop;
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;

    setScrollTop(scrolled);
  };

  useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className='fixed top-0 z-20 h-1 w-full bg-background'>
      <div className='h-1 bg-primary' style={{ width: `${scrollTop}%` }}></div>
    </div>
  );
}
