import { CategoryFilter } from '@/components/category/category-filter';
import { CategoryData } from '@/types';

export function SidebarCategory(props: CategoryData) {
  return (
    <aside className='md:block md:sticky hidden top-25 min-w-[200px] max-w-[200px] mt-4 font-pretendard'>
      <h2 className='md:block hidden px-4 pb-1 text-xl font-bold'>
        🗂️ Categories
      </h2>
      <CategoryFilter {...props} />
    </aside>
  );
}
export function InlineCategory(props: CategoryData) {
  return (
    <aside className='md:hidden block py-2'>
      <CategoryFilter {...props} isMobile />
    </aside>
  );
}
