import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import {
  BASE_URL,
  BLOG_DESCRIPTION,
  BLOG_NAME,
  BLOG_THUMBNAIL_URL,
} from '@/config/const';
import { Header } from '@/components/header/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: BLOG_NAME,
  description: BLOG_DESCRIPTION,
  openGraph: {
    title: BLOG_NAME,
    description: BLOG_DESCRIPTION,
    siteName: BLOG_NAME,
    images: [BLOG_THUMBNAIL_URL],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: BLOG_NAME,
    description: BLOG_DESCRIPTION,
    images: [BLOG_THUMBNAIL_URL],
  },
};

const pretendard = localFont({
  src: '../public/fonts/pretendard/PretendardVariable.ttf',
  variable: '--font-pretendard',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className='h-full scroll-my-20 scroll-smooth'
      data-scroll-behavior='smooth'
      suppressHydrationWarning
    >
      <body
        className={`${pretendard.variable} antialiased flex min-h-screen flex-col font-pretendard`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className='mt-[40px] flex flex-1 flex-col sm:mt-[64px]'>
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
