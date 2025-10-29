import { blog } from '@/.source';
import { BlogData } from '@/types';
import { HeaderWrapper } from './header-wrapper';

export function Header() {
  // 서버에서 포스트 데이터 가져오기
  const posts = blog.docs.map((doc) => {
    const data = doc as BlogData;
    return {
      title: data.title,
      description: data.description || '',
      slug: data._file.path.replace('.mdx', ''),
      date: data.date,
    };
  });

  return <HeaderWrapper posts={posts} />;
}
