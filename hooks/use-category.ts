'use client';

import { Post } from '@/types';
import { useSearchParams } from 'next/navigation';

export function useCategory(allPosts: Post[]) {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'All';

  const filteredPosts = selectedCategory === 'All' ? allPosts : allPosts.filter((post) => post.tags.includes(selectedCategory));

  const totalCounts = allPosts.length;
  const postCounts = filteredPosts.length;

  return { selectedCategory, filteredPosts, totalCounts, postCounts };
}
