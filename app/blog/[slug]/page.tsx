import { notFound } from 'next/navigation';
import { blog } from '@/.source';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 커스텀 페이지 데이터 타입
interface BlogPageData {
  title: string;
  description?: string;
  date: string;
  tags?: string[];
  featured?: boolean;
  readTime?: string;
  author?: string;
  thumbnail?: string;
  body: React.ComponentType;
  _file: { path: string };
}

// 정적 빌드를 위한 모든 slug 생성
export function generateStaticParams() {
  return blog.docs.map((doc) => ({
    slug: (doc as unknown as BlogPageData)._file.path.replace('.mdx', ''),
  }));
}

// SEO를 위한 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = blog.docs.find(
    (d) => (d as unknown as BlogPageData)._file.path.replace('.mdx', '') === slug
  );

  if (!doc) {
    return {
      title: 'Post Not Found',
    };
  }

  const pageData = doc as unknown as BlogPageData;

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
    (d) => (d as unknown as BlogPageData)._file.path.replace('.mdx', '') === slug
  );

  if (!doc) {
    notFound();
  }

  const pageData = doc as unknown as BlogPageData;
  const MDXContent = pageData.body;

  return (
    <article className='mx-auto w-full max-w-[800px] px-4 py-12'>
      {/* 썸네일 */}
      {pageData.thumbnail && (
        <div className='relative w-full h-[400px] mb-8 rounded-lg overflow-hidden'>
          <img
            src={pageData.thumbnail}
            alt={pageData.title || ''}
            className='object-cover w-full h-full'
          />
        </div>
      )}

      {/* 헤더 */}
      <header className='mb-12'>
        <div className='flex items-center gap-3 mb-4 flex-wrap'>
          {pageData.tags?.map((tag: string) => (
            <span
              key={tag}
              className='px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary'
            >
              {tag}
            </span>
          ))}
          {pageData.date && (
            <time className='text-sm text-muted-foreground'>{pageData.date}</time>
          )}
          {pageData.readTime && (
            <span className='text-sm text-muted-foreground'>{pageData.readTime}</span>
          )}
        </div>

        <h1 className='text-4xl font-bold mb-4'>{pageData.title}</h1>

        {pageData.description && (
          <p className='text-xl text-muted-foreground'>{pageData.description}</p>
        )}

        {pageData.author && (
          <div className='mt-4 text-sm text-muted-foreground'>
            By {pageData.author}
          </div>
        )}
      </header>

      {/* MDX 콘텐츠 */}
      <div className='prose prose-lg dark:prose-invert max-w-none'>
        <MDXContent />
      </div>
    </article>
  );
}
