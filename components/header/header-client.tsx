'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ThemeSwitcher } from './theme-switcher';
import { GithubIcon } from '../icon/github';
import { SearchDialog } from './search-dialog';
import Image from 'next/image';

export interface SearchPost {
  title: string;
  description: string;
  slug: string;
  date: string;
}

interface HeaderClientProps {
  posts: SearchPost[];
}

export function HeaderClient({ posts }: HeaderClientProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className='mt-1 flex h-[40px] w-full max-w-[1200px] items-center justify-between px-4 max-sm:pb-1 sm:h-[64px]'>
        <div
          className='overflow-hidden rounded-md cursor-pointer'
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
          <Button asChild variant='ghost' size='icon'>
            <Link href='https://github.com/jaerinjaerin' target='_blank'>
              <GithubIcon className='size-6' />
            </Link>
          </Button>
          <ThemeSwitcher />
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setSearchOpen(true)}
          >
            <Image
              src={'/images/icons/dynamic-color/zoom.png'}
              width={30}
              height={30}
              alt='search icon'
            />
          </Button>
        </div>
      </div>
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        posts={posts}
      />
    </>
  );
}
