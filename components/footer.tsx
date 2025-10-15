import Link from 'next/link';
import { GithubIcon } from './icon/github';

export function Footer() {
  return (
    <footer className='mb-16 mt-20 flex flex-col items-center justify-center gap-4 text-center print:hidden'>
      <div className='flex justify-center gap-4'>
        <Link href='https://github.com/d5br5' target='_blank'>
          <GithubIcon
            className='fill-foreground transition hover:fill-pink-600'
            height={30}
            width={30}
          />
        </Link>
      </div>
      <div>
        © {new Date().getFullYear()}.
        <span className='font-semibold'>JAERIN LEE</span> all rights reserved.
      </div>
    </footer>
  );
}
