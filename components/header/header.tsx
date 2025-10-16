'use client';
import Link from 'next/link';
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll';
import { Button } from '../ui/button';
import { ThemeSwitcher } from './theme-switcher';
import { ScrollProgressBar } from '../common/scroll-progress-bar';
import { GithubIcon } from '../icon/github';

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
        <div className='flex gap-2'>
          <ThemeSwitcher />
          <Button asChild variant='ghost' size='icon'>
            <Link href='https://github.com/leejaelll' target='_blank'>
              <GithubIcon className='size-6' />
            </Link>
          </Button>
        </div>
      </div>
      <ScrollProgressBar />
    </nav>
  );
}
