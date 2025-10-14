'use client';
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { targetRef, marginTop } = useHideOnScroll(65);

  return (
    <nav
      style={{ marginTop }}
      ref={targetRef}
      className='fixed z-40 flex w-full flex-col items-center justify-center border-b bg-background shadow-sm print:hidden'
    >
      <div className='mt-1 flex h-[40px] w-full max-w-[1200px] items-center justify-between px-4 max-sm:pb-1 sm:h-[64px]'>
        <div className='bg-red-100'>로고 들어갈 부분</div>

        <ThemeSwitcher />
      </div>
    </nav>
  );
}

function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <Button size={'icon'} variant={'ghost'} onClick={toggleTheme}>
      {mounted ? resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon /> : <div className='w-5 h-5' />}
    </Button>
  );
}
