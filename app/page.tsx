import { Suspense } from 'react';
import { HomePageClient } from '@/components/home/home-client';
import { blog } from '@/.source';
import { BlogData } from '@/types';
import { SsgoiTransition } from '@ssgoi/react';

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
      <section className='mx-auto w-full max-w-[1200px] px-4 mt-10 flex gap-5 md:gap-8 font-pretendard overflow-visible'>
        <Suspense fallback={<div>Loading...</div>}>
          <HomePageClient allPosts={sortedBlogs} allTags={allTags} />
        </Suspense>
      </section>
    </SsgoiTransition>
  );
}
