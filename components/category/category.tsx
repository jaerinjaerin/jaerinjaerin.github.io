import { CategoryFilter } from '@/components/category/category-filter';
import { CategoryData } from '@/types';

export function InlineCategory(props: CategoryData) {
  return (
    <aside className='mb-8'>
      <div className='font-bold mb-3'>Filter by tag</div>
      <CategoryFilter
        categories={props.categories}
        selectedCategory={props.selectedCategory}
        onCategoryChange={props.onCategoryChange}
      />
    </aside>
  );
}
