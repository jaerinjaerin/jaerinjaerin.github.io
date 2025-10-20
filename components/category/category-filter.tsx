'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'motion/react';
import Image from 'next/image';
import { CategoryData } from '@/types';

const CATEGORY_ICON_MAP: Record<string, string> = {
  All: 'color.png',
  'Next.js': 'music.png',
  React: 'target.png',
  Retrospective: 'megaphone.png',
  Typescript: 'key.png',
  // Add other category-icon mappings here
};

interface CategoryFilterProps extends CategoryData {
  isMobile?: boolean;
}

export function CategoryFilter({ categories, selectedCategory, categoryCounts, isMobile = false }: CategoryFilterProps) {
  return (
    <nav className={cn('flex gap-2', isMobile ? 'overflow-x-auto scrollbar-custom pb-3' : 'flex-col overflow-y-auto px-3 py-2')}>
      {/* 각 카테고리 */}
      {categories.map((category) => (
        <CategoryItem
          key={category}
          label={category}
          icon={CATEGORY_ICON_MAP[category]}
          count={categoryCounts?.[category] ?? 0}
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
  count?: number;
  href: string;
  isActive: boolean;
  isMobile: boolean;
  icon?: string;
}
function CategoryItem({ label, count, href, isActive, isMobile, icon }: CategoryItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[8px] bg-primary text-white font-extrabold transition-all duration-500 text-sm md:text-base',
        'hover:bg-muted-foreground hover:text-primary',
        isMobile && 'whitespace-nowrap flex-shrink-0',
        isActive && 'bg-muted-foreground text-primary'
      )}
    >
      {icon && <Image src={`/images/icons/dynamic-color/${icon}`} alt={label} width={25} height={25} />}
      <span>{`${label} (${count})`}</span>
    </Link>
    // </motion.div>
  );
}
