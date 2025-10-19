'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

export function ThemeSwitcher() {
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
      {mounted ? (
        <AnimatePresence mode='wait' initial={false}>
          {resolvedTheme === 'dark' ? (
            <motion.div
              key='sun'
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Image
                src={'/images/icons/sun.png'}
                width={36}
                height={36}
                alt='sun icon'
              />
            </motion.div>
          ) : (
            <motion.div
              key='moon'
              initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Image
                src={'/images/icons/moon.png'}
                width={36}
                height={36}
                alt='moon icon'
              />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className='w-5 h-5' />
      )}
    </Button>
  );
}
