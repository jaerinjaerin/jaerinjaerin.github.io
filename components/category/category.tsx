import { CategoryFilter } from '@/components/category/category-filter';

interface CategoryProps {
  categories: string[];
  postCounts: Record<string, number>;
  totalCount: number;
  selectedCategory: string;
}

export function WebCategory({ categories, postCounts, totalCount, selectedCategory }: CategoryProps) {
  return (
    <aside className='hidden md:block sticky top-20 self-start min-w-[200px] max-w-[200px] font-pretendard'>
      <h2 className='px-4 pb-1 text-xl font-bold'>🗂️ Categories</h2>
      <CategoryFilter categories={categories} postCounts={postCounts} totalCount={totalCount} selectedCategory={selectedCategory} />
    </aside>
  );
}

export function MobileCategory({ categories, postCounts, totalCount, selectedCategory }: CategoryProps) {
  return (
    <aside className='md:hidden block py-2'>
      <CategoryFilter categories={categories} postCounts={postCounts} totalCount={totalCount} selectedCategory={selectedCategory} isMobile />
    </aside>
  );
}
