'use client';

import { CategoryData, HomePageClientProps } from '@/types';
import { useCategory } from '@/hooks/use-category';
import { InlineCategory, SidebarCategory } from '../category/category';
import { Greeting } from './greeting';
import { BlogCard } from './blog-card';

export function HomePageClient({ allPosts, allTags }: HomePageClientProps) {
  const { selectedCategory, filteredPosts } = useCategory(allPosts);

  const categoryCounts = allTags.reduce((acc, tag) => {
    if (tag === 'All') {
      acc[tag] = allPosts.length;
    } else {
      acc[tag] = allPosts.filter((blog) => blog.tags.includes(tag)).length;
    }
    return acc;
  }, {} as Record<string, number>);

  console.log('➡️➡️➡️ categoryCounts', categoryCounts, selectedCategory);

  const categoryProps: CategoryData = {
    selectedCategory,
    categories: allTags,
    categoryCounts,
  };

  return (
    <>
      <SidebarCategory {...categoryProps} />
      <section className='flex-1 w-full'>
        {selectedCategory === 'All' && <Greeting />}
        <InlineCategory {...categoryProps} />

        <div className='text-xl font-bold my-4'>
          📂 {selectedCategory === 'All' ? 'All Posts' : selectedCategory} (
          {categoryCounts[selectedCategory]})
        </div>
        <div className=' grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
          {filteredPosts.map((blog) => {
            return <BlogCard blog={blog} key={blog.slug} />;
          })}
        </div>
      </section>
    </>
  );
}
