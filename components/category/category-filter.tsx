'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CategoryData } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { CATEGORY_ICON_MAP } from '@/constants/icon';

interface CategoryFilterProps extends CategoryData {
  isMobile?: boolean;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  categoryCounts,
  isMobile = false,
}: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams();
    if (category !== 'All') {
      params.set('category', category);
    }
    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <nav
      className={cn(
        'flex gap-2',
        isMobile
          ? 'overflow-x-auto scrollbar-custom pb-3'
          : 'flex-col overflow-y-auto py-2'
      )}
    >
      {/* 각 카테고리 */}
      {categories.map((category) => (
        <CategoryItem
          key={category}
          selectedCategory={selectedCategory}
          category={category}
          isMobile={isMobile}
          handleCategoryClick={() => handleCategoryClick(category)}
          categoryCounts={categoryCounts}
          isActive={selectedCategory === category}
          icon={CATEGORY_ICON_MAP[category]}
        />
      ))}
    </nav>
  );
}

interface CategoryItemProps {
  icon?: string;
  isActive: boolean;
  isMobile: boolean;
  category: string;
  selectedCategory: string;
  categoryCounts: Record<string, number>;
  handleCategoryClick: () => void;
}

function CategoryItem({
  icon,
  isActive,
  isMobile,
  category,
  selectedCategory,
  categoryCounts,
  handleCategoryClick,
}: CategoryItemProps) {
  return (
    <button
      key={category}
      onClick={handleCategoryClick}
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
          alt={icon}
          width={25}
          height={25}
        />
      )}
      <span className='text-start'>{category}</span>
    </button>
  );
}
