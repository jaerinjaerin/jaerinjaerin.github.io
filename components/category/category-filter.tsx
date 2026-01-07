'use client';

import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange?: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const handleCategoryClick = (category: string) => {
    onCategoryChange?.(category);
  };
  return (
    <nav className='flex gap-2 overflow-x-auto scrollbar-custom p-1'>
      {/* 각 카테고리 */}
      {categories.map((category) => (
        <CategoryItem
          key={category}
          category={category}
          handleCategoryClick={() => handleCategoryClick(category)}
          isActive={selectedCategory === category}
        />
      ))}
    </nav>
  );
}

interface CategoryItemProps {
  isActive: boolean;
  category: string;
  handleCategoryClick: () => void;
}

function CategoryItem({
  isActive,
  category,
  handleCategoryClick,
}: CategoryItemProps) {
  return (
    <button
      key={category}
      onClick={handleCategoryClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-full ring-1 ring-primary bg-transparent font-semibold transition-all duration-300 text-sm whitespace-nowrap flex-shrink-0',
        'hover:bg-primary hover:text-white',
        isActive && 'bg-primary text-white'
      )}
    >
      <span className='text-start'>{category}</span>
    </button>
  );
}
