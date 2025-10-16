import {
  getCategories,
  getAllPosts,
  getPostsByCategory,
  getPostCountByCategory,
} from '@/lib/posts';
import { PostList } from '@/components/post/post-list';
import { MobileCategory, WebCategory } from '@/components/category/category';
import { Greeting } from '@/components/greeting';

interface HomeProps {
  searchParams: Promise<{
    category?: string;
  }>;
}
export default async function Home({ searchParams }: HomeProps) {
  const { category } = await searchParams;
  const categories = getCategories();
  const postCounts = getPostCountByCategory();
  const selectedCategory = category || 'all';
  // 선택된 카테고리에 따라 포스트 필터링
  const posts =
    selectedCategory === 'all'
      ? getAllPosts()
      : getPostsByCategory(selectedCategory);
  const totalCount = getAllPosts().length;

  return (
    <section className='mx-auto w-full max-w-[1200px] px-4 mt-10  flex gap-5 md:gap-8 font-pretendard overflow-visible'>
      <WebCategory
        categories={categories}
        postCounts={postCounts}
        totalCount={totalCount}
        selectedCategory={selectedCategory}
      />

      <section className='flex-1 w-full'>
        <Greeting />
        {/* 모바일 카테고리 */}
        <MobileCategory
          categories={categories}
          postCounts={postCounts}
          totalCount={totalCount}
          selectedCategory={selectedCategory}
        />

        <PostList posts={posts} selectedCategory={selectedCategory} />
      </section>
    </section>
  );
}
