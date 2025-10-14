'use client';
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll';
import { useTheme } from 'next-themes';

export function Header() {
  const { targetRef, marginTop } = useHideOnScroll(65);
  console.log(targetRef, marginTop);

  return (
    <nav
      style={{ marginTop }}
      ref={targetRef}
      className='fixed z-40 flex w-full flex-col items-center justify-center border-b bg-background shadow-sm print:hidden'
    >
      <div className='mt-1 flex h-[40px] w-full max-w-[1200px] items-center justify-between px-4 max-sm:pb-1 sm:h-[64px]'>
        <div className='bg-red-100'>로고 들어갈 부분</div>
        <div className='bg-blue-200'>
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      The current theme is: {theme}
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </>
  );
}
