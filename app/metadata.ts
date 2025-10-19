import { Metadata } from 'next';
import { siteConfig } from '@/lib/site';

// TODO: 수정 필요 (+images 추가)
export const metadataKeywords = ['Blog', 'React'];

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: metadataKeywords,
  creator: 'jaerinjaerin',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// export const metadata: Metadata = {
//   metadataBase: new URL(BASE_URL),
//   title: BLOG_NAME,
//   description: BLOG_DESCRIPTION,
//   openGraph: {
//     title: BLOG_NAME,
//     description: BLOG_DESCRIPTION,
//     siteName: BLOG_NAME,
//     images: [BLOG_THUMBNAIL_URL],
//     type: 'website',
//   },
//   twitter: {
//     card: 'summary_large_image',
//     title: BLOG_NAME,
//     description: BLOG_DESCRIPTION,
//     images: [BLOG_THUMBNAIL_URL],
//   },
// };
