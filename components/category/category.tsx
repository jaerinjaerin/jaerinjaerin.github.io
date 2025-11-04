import { CategoryFilter } from '@/components/category/category-filter';
import { CategoryData } from '@/types';

export function SidebarCategory(props: CategoryData) {
  return (
    <aside className='md:block md:sticky hidden top-25 w-[180px] mt-4 font-pretendard self-start h-[400px] overflow-y-auto'>
      <h2 className='px-2 pb-1 text-xl font-bold'>🗂️ Categories</h2>
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
