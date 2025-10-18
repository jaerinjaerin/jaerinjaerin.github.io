'use client';

import Link from 'next/link';
import { GithubIcon } from './icon/github';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';

export function Footer() {
  const { ref, inView } = useInView({
    triggerOnce: false, // 다시 화면에 들어오면 재시작
    threshold: 0.1, // 10% 이상 보여야 inView = true
  });

  return (
    <footer
      ref={ref}
      className='mt-10 md:mt-20 flex flex-col items-center justify-center gap-2 text-center print:hidden border-t-2 py-5 md:py-10'
    >
      <div className='flex justify-center gap-4'>
        <Link href='https://github.com/leejaelll' target='_blank'>
          <motion.div
            key={inView ? 'float' : 'still'}
            animate={
              inView
                ? {
                    y: [0, -6, 0, 6, 0],
                    rotate: [0, 1, 0, -1, 0],
                  }
                : { y: 0, rotate: 0 }
            }
            transition={{
              duration: 4,
              repeat: inView ? Infinity : 0,
              ease: 'easeInOut',
              repeatType: 'mirror',
            }}
          >
            <GithubIcon className='size-[30px]' />
          </motion.div>
        </Link>
      </div>
      <div>
        © {new Date().getFullYear()}.{' '}
        <span className='font-semibold'>JAERIN LEE</span> all rights reserved.
      </div>
    </footer>
  );
}
