'use client';

import { CategoryData, HomePageClientProps } from '@/types';
import { InlineCategory } from '../category/category';
import { BlogCard } from './blog-card';
import { useState, useEffect, useRef } from 'react';

const INITIAL_POSTS_COUNT = 9; // 초기 로드 포스트 수 (3x3 그리드)
const POSTS_PER_PAGE = 9; // 스크롤 시 추가 로드 포스트 수

export function HomePageClient({ allPosts, allTags }: HomePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [displayCount, setDisplayCount] = useState(INITIAL_POSTS_COUNT);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 필터링된 포스트
  const filteredPosts =
    selectedCategory === 'All'
      ? allPosts
      : allPosts.filter((post) => post.tags.includes(selectedCategory));

  const categoryCounts = allTags.reduce((acc, tag) => {
    if (tag === 'All') {
      acc[tag] = allPosts.length;
    } else {
      acc[tag] = allPosts.filter((blog) => blog.tags.includes(tag)).length;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoryProps: CategoryData = {
    selectedCategory,
    categories: allTags,
    categoryCounts,
    onCategoryChange: setSelectedCategory,
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

  // 처음 2개와 나머지 분리
  const featuredPosts = visiblePosts.slice(0, 2);
  const remainingPosts = visiblePosts.slice(2);

  return (
    <>
      <section className='flex-1 w-full container pt-12 pb-20'>
        <InlineCategory {...categoryProps} />

        {/* 처음 2개 포스트 - 2열 */}
        {featuredPosts.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-12'>
            {featuredPosts.map((blog) => (
              <BlogCard blog={blog} key={blog.slug} featured />
            ))}
          </div>
        )}

        {/* 나머지 포스트 - 1열 (가로 레이아웃) */}
        {remainingPosts.length > 0 && (
          <div className='col-span-12 md:col-span-10 md:col-start-2 grid grid-cols-1 gap-6'>
            {remainingPosts.map((blog) => (
              <div key={blog.slug} className='flex w-full'>
                <BlogCard blog={blog} />
              </div>
            ))}
          </div>
        )}

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
