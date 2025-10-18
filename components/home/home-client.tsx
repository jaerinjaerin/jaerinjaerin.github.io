'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { Post } from '@/lib/posts';
import { PostList } from '@/components/post/post-list';
import { MobileCategory, WebCategory } from '@/components/category/category';
import { Greeting } from '@/components/greeting';

interface HomeClientProps {
  categories: string[];
  postCounts: Record<string, number>;
  totalCount: number;
  allPosts: Post[];
}

function HomeClientContent({
  categories,
  postCounts,
  totalCount,
  allPosts,
}: HomeClientProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const selectedCategory = category || 'all';
  console.log(selectedCategory);

  // 선택된 카테고리에 따라 포스트 필터링
  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') {
      return allPosts;
    }
    return allPosts.filter((post) => post.category === selectedCategory);
  }, [selectedCategory, allPosts]);

  return (
    <>
      <WebCategory
        categories={categories}
        postCounts={postCounts}
        totalCount={totalCount}
        selectedCategory={selectedCategory}
      />

      <section className='flex-1 w-full'>
        {selectedCategory === 'all' && <Greeting />}
        {/* 모바일 카테고리 */}
        <MobileCategory
          categories={categories}
          postCounts={postCounts}
          totalCount={totalCount}
          selectedCategory={selectedCategory}
        />

        <PostList posts={filteredPosts} selectedCategory={selectedCategory} />
      </section>
    </>
  );
}

export function HomeClient(props: HomeClientProps) {
  return (
    <Suspense
      fallback={
        <>
          <aside className='hidden md:block sticky top-20 self-start min-w-[200px] max-w-[200px] font-pretendard'>
            <h2 className='px-4 pb-1 text-xl font-bold'>🗂️ Categories</h2>
          </aside>
          <section className='flex-1 w-full'>
            <Greeting />
          </section>
        </>
      }
    >
      <HomeClientContent {...props} />
    </Suspense>
  );
}
