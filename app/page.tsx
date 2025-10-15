import Image from 'next/image';
import { getCategories, getAllPosts, getPostsByCategory, getPostCountByCategory } from '@/lib/posts';
import { CategoryFilter } from '@/components/category-filter';
import { PostList } from '@/components/post/post-list';

interface HomeProps {
  searchParams: {
    category?: string;
  };
}
export default function Home({ searchParams }: HomeProps) {
  const categories = getCategories();
  const postCounts = getPostCountByCategory();
  const selectedCategory = searchParams.category || 'all';
  // 선택된 카테고리에 따라 포스트 필터링
  const posts = selectedCategory === 'all' ? getAllPosts() : getPostsByCategory(selectedCategory);
  const totalCount = getAllPosts().length;

  return (
    <section className='mx-auto w-full max-w-[1200px] px-4 md:px-5 mt-10  flex gap-5 md:gap-8 font-pretendard overflow-visible'>
      <WebCategory categories={categories} postCounts={postCounts} totalCount={totalCount} selectedCategory={selectedCategory} />

      <section className='flex-1 w-full'>
        <h2 className='text-3xl font-extrabold'>Hello world!🌎</h2>
        {/* 모바일 카테고리 */}
        <MobileCategory categories={categories} postCounts={postCounts} totalCount={totalCount} selectedCategory={selectedCategory} />

        <PostList posts={posts} selectedCategory={selectedCategory} />
      </section>
    </section>
  );
}

interface CategoryProps {
  categories: string[];
  postCounts: Record<string, number>;
  totalCount: number;
  selectedCategory: string;
}

function WebCategory({ categories, postCounts, totalCount, selectedCategory }: CategoryProps) {
  return (
    <aside className='md:block md:sticky hidden top-25 min-w-[200px] max-w-[200px] mt-4'>
      <CategoryFilter categories={categories} postCounts={postCounts} totalCount={totalCount} selectedCategory={selectedCategory} />
    </aside>
  );
}

function MobileCategory({ categories, postCounts, totalCount, selectedCategory }: CategoryProps) {
  return (
    <aside className='md:hidden block py-2'>
      <CategoryFilter categories={categories} postCounts={postCounts} totalCount={totalCount} selectedCategory={selectedCategory} isMobile />
    </aside>
  );
}
