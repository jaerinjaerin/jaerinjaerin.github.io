'use client';

import { CategoryData, HomePageClientProps } from '@/types';
import { useCategory } from '@/hooks/use-category';
import { InlineCategory, SidebarCategory } from '../category/category';
import { Greeting } from './greeting';
import { BlogCard } from './blog-card';
import { useState, useEffect, useRef } from 'react';

const INITIAL_POSTS_COUNT = 9; // 초기 로드 포스트 수 (3x3 그리드)
const POSTS_PER_PAGE = 9; // 스크롤 시 추가 로드 포스트 수

export function HomePageClient({ allPosts, allTags }: HomePageClientProps) {
  const { selectedCategory, filteredPosts } = useCategory(allPosts);
  const [displayCount, setDisplayCount] = useState(INITIAL_POSTS_COUNT);
  const observerTarget = useRef<HTMLDivElement>(null);

  const categoryCounts = allTags.reduce((acc, tag) => {
    if (tag === 'All') {
      acc[tag] = allPosts.length;
    } else {
      acc[tag] = allPosts.filter((blog) => blog.tags.includes(tag)).length;
    }
    return acc;
  }, {} as Record<string, number>);

  console.log('➡️➡️➡️ categoryCounts', categoryCounts, selectedCategory);

  const categoryProps: CategoryData = {
    selectedCategory,
    categories: allTags,
    categoryCounts,
  };

  // 카테고리 변경 시 displayCount 초기화
  useEffect(() => {
    setDisplayCount(INITIAL_POSTS_COUNT);
  }, [selectedCategory]);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredPosts.length) {
          setDisplayCount((prev) =>
            Math.min(prev + POSTS_PER_PAGE, filteredPosts.length)
          );
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // 100px 전에 미리 로드
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [displayCount, filteredPosts.length]);

  const visiblePosts = filteredPosts.slice(0, displayCount);
  const hasMore = displayCount < filteredPosts.length;

  return (
    <>
      <SidebarCategory {...categoryProps} />
      <section className='flex-1 w-full'>
        {selectedCategory === 'All' && <Greeting />}
        <InlineCategory {...categoryProps} />

        <div className='text-xl font-bold my-4'>
          📂 {selectedCategory === 'All' ? 'All Posts' : selectedCategory} (
          {categoryCounts[selectedCategory]})
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
          {visiblePosts.map((blog) => {
            return <BlogCard blog={blog} key={blog.slug} />;
          })}
        </div>

        {/* Infinite Scroll Trigger */}
        {hasMore && (
          <div
            ref={observerTarget}
            className='h-20 flex items-center justify-center'
          >
            <div className='text-sm text-gray-500'>Loading more posts...</div>
          </div>
        )}
      </section>
    </>
  );
}
