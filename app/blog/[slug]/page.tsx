import { notFound } from 'next/navigation';
import { blog } from '@/.source';
import type { Metadata } from 'next';
import { BlogData } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import { DocsBody } from 'fumadocs-ui/page';
import { getAuthor, isValidAuthor } from '@/lib/authors';
import { AuthorCard } from '@/components/blog/author-card';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { MobileTableOfContents } from '@/components/blog/mobile-toc';
import { SsgoiTransition } from '@ssgoi/react';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 정적 빌드를 위한 모든 slug 생성
export function generateStaticParams() {
  return blog.docs.map((doc) => {
    const blogData = doc as BlogData;
    const slug = blogData._file.path.replace(/\.mdx$/, '');
    return { slug };
  });
}

// SEO를 위한 메타데이터 생성
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = blog.docs.find(
    (d) => (d as BlogData)._file.path.replace('.mdx', '') === slug
  );

  if (!doc) {
    return {
      title: 'Post Not Found',
    };
  }

  const pageData = doc as BlogData;

  return {
    title: pageData.title,
    description: pageData.description,
    openGraph: {
      title: pageData.title,
      description: pageData.description,
      images: pageData.thumbnail ? [pageData.thumbnail] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = blog.docs.find(
    (d) => (d as BlogData)._file.path.replace('.mdx', '') === slug
  );

  if (!doc) {
    notFound();
  }

  const pageData = doc as BlogData;
  const MDXContent = pageData.body;
  const date = new Date(pageData.date);
  const formattedDate = formatDate(date);

  return (
    <SsgoiTransition id='/blog/*'>
      <div className='min-h-screen bg-background relative'>
        <header className='container grid grid-cols-1 lg:grid-cols-12 gap-6 mt-12 lg:mb-20 items-center'>
          <div className='col-span-6 flex flex-col md:pr-12 gap-6'>
            {/* 카테고리 + 날짜 + 읽기 시간 */}
            <div className='flex flex-col sm:flex-row sm:items-center gap-4 text-gray-500 text-base'>
              {pageData.tags && pageData.tags.length > 0 && (
                <span className='flex tracking-tight items-center gap-1.5 relative h-6 font-bold text-sm text-gray-900'>
                  <Link
                    href='/'
                    className='flex items-center gap-1.5 focus:outline-none focus:ring-2 ring-offset-2 rounded-sm max-w-full'
                  >
                    <span className='w-5 h-5 rounded bg-primary/20 flex items-center justify-center'>
                      <span className='w-2 h-2 rounded bg-primary' />
                    </span>
                    <span className='whitespace-nowrap overflow-ellipsis overflow-hidden'>
                      {pageData.tags[0]}
                    </span>
                  </Link>
                </span>
              )}
              <div className='flex gap-2'>
                <time className='text-gray-500'>{formattedDate}</time>
                {pageData.readTime && (
                  <>
                    <span>·</span>
                    <span>{pageData.readTime}</span>
                  </>
                )}
              </div>
            </div>

            {/* 제목 */}
            <h1 className='text-4xl md:text-6xl lg:text-7xl 2xl:text-8xl font-bold max-w-lg lg:max-w-none break-words'>
              {pageData.title}
            </h1>

            {/* 작성자 + 조회수 */}
            <div className='flex items-center text-gray-500 text-base gap-4'>
              {pageData.author && (
                <div className='flex items-center gap-2 text-sm overflow-hidden'>
                  <span className='truncate py-1'>By {pageData.author}</span>
                </div>
              )}
            </div>
          </div>

          {/* 썸네일 이미지 */}
          <div className='col-span-6 relative'>
            {pageData.thumbnail && (
              <div className='rounded-2xl border-2 border-gray-900 overflow-hidden'>
                <div className='-m-px'>
                  <Image
                    src={pageData.thumbnail}
                    alt={pageData.title}
                    width={517}
                    height={290}
                    className='w-full'
                    priority
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        <div className='flex divide-x divide-border relative max-w-7xl mx-auto px-4 md:px-0 z-10'>
          <div className='absolute max-w-7xl mx-auto left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] lg:w-full h-full border-x border-border p-0 pointer-events-none' />
          <main className='w-full p-0 overflow-hidden'>
            <div className='p-6 lg:p-10'>
              <div className='prose dark:prose-invert max-w-none prose-headings:scroll-mt-8 prose-headings:font-semibold prose-a:no-underline prose-headings:tracking-tight prose-headings:text-balance prose-p:tracking-tight prose-lg'>
                <DocsBody>
                  <MDXContent />
                </DocsBody>
              </div>
            </div>
          </main>

          <aside className='hidden lg:block w-[350px] flex-shrink-0 p-6 lg:p-10 bg-muted-foreground/20 dark:bg-background'>
            <div className='sticky top-20 space-y-8'>
              {pageData.author && isValidAuthor(pageData.author) && (
                <AuthorCard author={getAuthor(pageData.author)} />
              )}
              <div className='border border-ring/30 bg-background rounded-lg p-6 '>
                <TableOfContents />
              </div>
            </div>
          </aside>
        </div>
        <MobileTableOfContents />
      </div>
    </SsgoiTransition>
  );
}
