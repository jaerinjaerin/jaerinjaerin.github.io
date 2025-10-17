'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'motion/react';
import Image from 'next/image';

const CATEGORY_ICON_MAP: Record<string, string> = {
  all: 'color.png',
  'Next.js': 'music.png',
  React: 'target.png',
  Retrospective: 'megaphone.png',
  Typescript: 'key.png',
  // Add other category-icon mappings here
};

interface CategoryFilterProps {
  categories: string[];
  postCounts: Record<string, number>;
  totalCount: number;
  selectedCategory: string;
  isMobile?: boolean;
}

export function CategoryFilter({
  categories,
  postCounts,
  totalCount,
  selectedCategory,
  isMobile = false,
}: CategoryFilterProps) {
  return (
    <nav
      className={cn(
        'flex gap-2',
        isMobile
          ? 'overflow-x-auto scrollbar-custom pb-3'
          : 'flex-col overflow-y-auto px-3 py-2' // px-3 py-2 추가, overflow-x-visible 제거
      )}
    >
      {/* ALL 카테고리 */}
      <CategoryItem
        label='All'
        count={totalCount}
        href='/'
        icon={CATEGORY_ICON_MAP['all']}
        isActive={selectedCategory === 'all'}
        isMobile={isMobile}
      />

      {/* 각 카테고리 */}
      {categories.map((category) => (
        <CategoryItem
          key={category}
          label={category}
          icon={CATEGORY_ICON_MAP[category]}
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
  icon?: string;
}
function CategoryItem({
  label,
  count,
  href,
  isActive,
  isMobile,
  icon,
}: CategoryItemProps) {
  return (
    // <motion.div
    //   whileHover={{
    //     scale: 1.05,
    //   }}
    //   whileTap={{ scale: 0.95 }}
    //   transition={{
    //     type: 'spring',
    //     stiffness: 400,
    //     damping: 10,
    //     mass: 0.3,
    //   }}
    // >
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[8px] bg-primary text-white font-extrabold transition-all duration-500 text-sm md:text-base',
        'hover:bg-muted-foreground hover:text-primary',
        isMobile && 'whitespace-nowrap flex-shrink-0',
        isActive && 'bg-muted-foreground text-primary'
      )}
    >
      {icon && (
        <Image
          src={`/images/icons/dynamic-color/${icon}`}
          alt={label}
          width={25}
          height={25}
        />
      )}
      <span>{label}</span>
    </Link>
    // </motion.div>
  );
}
