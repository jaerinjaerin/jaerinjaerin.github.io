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

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 정적 빌드를 위한 모든 slug 생성
export function generateStaticParams() {
  return blog.docs.map((doc) => ({
    slug: (doc as BlogData)._file.path.replace('.mdx', ''),
  }));
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
    <div className='min-h-screen bg-background relative'>
      <div className='space-y-4 border-b border-border relative z-10'>
        <div className='max-w-7xl mx-auto flex flex-col gap-6 p-6'>
          <div className='flex flex-wrap items-center gap-3 gap-y-5 text-sm text-sidebar-ring'>
            <Button variant='outline' asChild className='h-6 w-6'>
              <Link href='/'>
                <ArrowLeft className='w-4 h-4' />
                <span className='sr-only'>Back to all articles</span>
              </Link>
            </Button>
            {pageData.tags && pageData.tags.length > 0 && (
              <div className='flex flex-wrap gap-3 text-sidebar-ring items-center'>
                {pageData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className='h-6 w-fit px-3 text-sm font-medium bg-muted-foreground text-muted rounded-md border flex items-center justify-center'
                  >
                    {tag}
                  </span>
                ))}
                <time className='font-medium text-primary/50 dark:text-primary'>
                  {formattedDate}
                </time>
              </div>
            )}
          </div>
          <h1 className='text-4xl md:text-5xl lg:text-6xl tracking-tighter font-waguri font-extrabold'>
            {pageData.title}
          </h1>
          {pageData.description && (
            <p className='text-muted max-w-4xl md:text-lg'>
              {pageData.description}
            </p>
          )}
        </div>
      </div>
      <div className='flex divide-x divide-border relative max-w-7xl mx-auto px-4 md:px-0 z-10'>
        <div className='absolute max-w-7xl mx-auto left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] lg:w-full h-full border-x border-border p-0 pointer-events-none' />
        <main className='w-full p-0 overflow-hidden'>
          {pageData.thumbnail && (
            <div className='relative w-full h-[500px] overflow-hidden border border-transparent'>
              <Image
                src={pageData.thumbnail}
                alt={pageData.title}
                fill
                className='object-contain'
                priority
              />
            </div>
          )}
          <div className='p-6 lg:p-10'>
            <div className='prose dark:prose-invert max-w-none prose-headings:scroll-mt-8 prose-headings:font-semibold prose-a:no-underline prose-headings:tracking-tight prose-headings:text-balance prose-p:tracking-tight prose-p:text-balance prose-lg'>
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
  );
}
