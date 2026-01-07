import { Suspense } from 'react';
import { HomePageClient } from '@/components/home/home-client';
import { blog } from '@/.source';
import { BlogData } from '@/types';
import { SsgoiTransition } from '@ssgoi/react';
import { GitBranch } from 'lucide-react';

function LoadingSkeleton() {
  return (
    <div className='w-full px-4 mt-10'>
      <div className='flex flex-col gap-6 animate-pulse'>
        {/* Category Skeleton */}
        <div className='h-10 bg-muted-foreground/20 rounded-lg w-full max-w-[600px]' />

        {/* Title Skeleton */}
        <div className='h-8 bg-muted-foreground/20 rounded-lg w-48' />

        {/* Grid Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className='h-[280px] bg-muted-foreground/20 rounded-lg'
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  // 정적 빌드를 위한 블로그 포스트 데이터
  const allPosts = blog.docs.map((doc) => {
    const data = doc as BlogData;
    return {
      slug: data._file.path.replace('.mdx', ''),
      title: data.title,
      description: data.description,
      date: data.date,
      tags: data.tags || [],
      featured: data.featured || false,
      readTime: data.readTime,
      author: data.author,
      thumbnail: data.thumbnail,
    };
  });

  const sortedBlogs = allPosts.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  const allTags = [
    'All',
    ...Array.from(
      new Set(sortedBlogs.flatMap((blog) => blog.tags || []))
    ).sort(),
  ];

  return (
    <SsgoiTransition id='/'>
      <div className='text-center py-14 px-6 bg-primary-foreground/40'>
        <GitBranch className='size-14 mx-auto bg-primary-foreground rounded-lg p-1' />
        <h1 className='font-headings tracking-tight scroll-mt-[120px] text-4xl lg:text-5xl 2xl:text-6xl font-bold mt-6 wrap-balance'>
          Developer Workflow
        </h1>
        <div className=' text-base 2xl:text-md font-medium print:text-[12px] print:text-justify mt-6 max-w-xl mx-auto'>
          <p className='my-6 first:mt-0 last:mb-0 print:my-2 text-gray-500'>
            Optimize your development process for maximum productivity.
          </p>
        </div>
      </div>
      <section className='mx-auto w-full max-w-[1200px] font-pretendard overflow-visible'>
        <Suspense fallback={<LoadingSkeleton />}>
          <HomePageClient allPosts={sortedBlogs} allTags={allTags} />
        </Suspense>
      </section>
    </SsgoiTransition>
  );
}

// px-4 mt-10
