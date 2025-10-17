import {
  getCategories,
  getAllPosts,
  getPostCountByCategory,
} from '@/lib/posts';
import { HomeClient } from '@/components/home-client';

export default function Home() {
  const categories = getCategories();
  const postCounts = getPostCountByCategory();
  const allPosts = getAllPosts();
  const totalCount = allPosts.length;

  return (
    <section className='mx-auto w-full max-w-[1200px] px-4 mt-10  flex gap-5 md:gap-8 font-pretendard overflow-visible'>
      <HomeClient
        categories={categories}
        postCounts={postCounts}
        totalCount={totalCount}
        allPosts={allPosts}
      />
    </section>
  );
}
