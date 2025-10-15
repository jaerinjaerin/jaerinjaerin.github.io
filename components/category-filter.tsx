'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'motion/react';

interface CategoryFilterProps {
  categories: string[];
  postCounts: Record<string, number>;
  totalCount: number;
  selectedCategory: string;
  isMobile?: boolean;
}

export function CategoryFilter({ categories, postCounts, totalCount, selectedCategory, isMobile = false }: CategoryFilterProps) {
  return (
    <nav
      className={cn(
        'flex gap-2',
        isMobile ? 'overflow-x-auto scrollbar-custom pb-3' : 'flex-col overflow-y-auto px-3 py-2' // px-3 py-2 추가, overflow-x-visible 제거
      )}
    >
      {/* ALL 카테고리 */}
      <CategoryItem label='All' count={totalCount} href='/' isActive={selectedCategory === 'all'} isMobile={isMobile} />

      {/* 각 카테고리 */}
      {categories.map((category) => (
        <CategoryItem
          key={category}
          label={category}
          count={postCounts[category] || 0}
          href={`/?category=${encodeURIComponent(category)}`}
          isActive={selectedCategory === category}
          isMobile={isMobile}
        />
      ))}
    </nav>
  );
}

interface CategoryItemProps {
  label: string;
  count: number;
  href: string;
  isActive: boolean;
  isMobile: boolean;
}
function CategoryItem({ label, count, href, isActive, isMobile }: CategoryItemProps) {
  return (
    <motion.div
      whileHover={{
        scale: 1.05,
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 10,
        mass: 0.3,
      }}
    >
      <Link href={href} className={cn('flex items-center justify-between gap-2 px-4 py-2', isMobile && 'whitespace-nowrap flex-shrink-0')}>
        <span>{label}</span>
        <span className={cn('ml-2 text-sm', isActive ? 'text-foreground' : 'text-muted-foreground')}>{count}</span>
      </Link>
    </motion.div>
  );
}
