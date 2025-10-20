'use client';
import Link from 'next/link';
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll';
import { Button } from '../ui/button';
import { ThemeSwitcher } from './theme-switcher';
import { ScrollProgressBar } from '../common/scroll-progress-bar';
import { GithubIcon } from '../icon/github';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function Header() {
  const { targetRef, marginTop } = useHideOnScroll(65);
  const router = useRouter();

  return (
    <nav
      style={{ marginTop }}
      ref={targetRef}
      className='fixed z-40 flex w-full flex-col items-center justify-center border-b bg-background shadow-sm print:hidden'
    >
      <div className='mt-1 flex h-[40px] w-full max-w-[1200px] items-center justify-between px-4 max-sm:pb-1 sm:h-[64px]'>
        <div
          className=' overflow-hidden rounded-md'
          onClick={() => router.push('/')}
        >
          <Image
            src={'/images/logo/logo-long.png'}
            width={100}
            height={40}
            alt='logo image'
          />
        </div>
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
