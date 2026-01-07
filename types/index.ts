// 커스텀 페이지 데이터 타입
export interface BlogData {
  title: string;
  description?: string;
  date: string;
  tags?: string[];
  featured?: boolean;
  readTime?: string;
  author?: string;
  thumbnail?: string;
  body: React.ComponentType;
  _file: { path: string };
}

export interface Post {
  slug: string;
  title: string;
  description?: string;
  date: string;
  tags: string[];
  featured: boolean;
  readTime?: string;
  author?: string;
  thumbnail?: string;
  viewCount?: number;
}

export interface CategoryData {
  categories: string[];
  selectedCategory: string;
  categoryCounts: Record<string, number>;
  onCategoryChange?: (category: string) => void;
}

export interface HomePageClientProps {
  allPosts: Post[];
  allTags: string[];
}
