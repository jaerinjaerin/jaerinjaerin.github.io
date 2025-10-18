import { notFound } from 'next/navigation';
import { getPostBySlug, getAllSlugs } from '@/lib/posts';
import { format } from 'date-fns';
import Image from 'next/image';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 정적 빌드를 위한 slug 생성
export function generateStaticParams() {
  return getAllSlugs();
}

// SEO: 메타데이터 생성
export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.meta.title,
    description: post.meta.description,
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      images: post.meta.thumbnail ? [post.meta.thumbnail] : [],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className='mx-auto w-full max-w-[800px] px-4 py-12'>
      {/* 썸네일 (있을 경우) */}
      {post.meta.thumbnail && (
        <div className='relative w-full h-[400px] mb-8 rounded-lg overflow-hidden'>
          <Image
            src={post.meta.thumbnail}
            alt={post.meta.title}
            fill
            className='object-cover'
            priority
          />
        </div>
      )}

      {/* 헤더 */}
      <header className='mb-12'>
        <div className='flex items-center gap-3 mb-4'>
          <span className='px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary'>
            {post.category}
          </span>
          {post.meta.createdAt && (
            <time className='text-sm text-muted'>
              {format(new Date(post.meta.createdAt), 'yyyy년 MM월 dd일')}
            </time>
          )}
        </div>

        <h1 className='text-4xl font-bold mb-4'>{post.meta.title}</h1>

        {post.meta.description && (
          <p className='text-xl text-muted'>{post.meta.description}</p>
        )}
      </header>

      {/* MDX 콘텐츠 */}
      <div className='prose prose-lg dark:prose-invert max-w-none'>
        {post.content}
      </div>
    </article>
  );
}
