'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { MobileCategory, WebCategory } from '@/components/category/category';
import { Greeting } from '@/components/greeting';

function HomeClientContent() {
  return (
    <>
      {/* <WebCategory
        categories={categories}
        postCounts={postCounts}
        totalCount={totalCount}
        selectedCategory={selectedCategory}
      /> */}

      <section className='flex-1 w-full'>
        {/* {selectedCategory === 'all' && <Greeting />} */}
        {/* 모바일 카테고리 */}
        {/* <MobileCategory
          categories={categories}
          postCounts={postCounts}
          totalCount={totalCount}
          selectedCategory={selectedCategory}
        /> */}
      </section>
    </>
  );
}

export function HomeClient() {
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
      <HomeClientContent />
    </Suspense>
  );
}
