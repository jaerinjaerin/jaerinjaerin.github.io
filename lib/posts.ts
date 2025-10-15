// 데이터 구조 및 유틸리티 함수

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Post {
  slug: string;
  category: string;
  title: string;
  date: string;
  description?: string;
}

export interface PostWithContent extends Post {
  content: string;
}

const postsDirectory = path.join(process.cwd(), 'posts');
console.log('⚠️ postsDirectory', postsDirectory);

/**
 * 모든 카테고리 가져오기
 */
export function getCategories(): string[] {
  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/**
 * 특정 카테고리의 포스트 가져오기
 */
export function getPostsByCategory(category: string): Post[] {
  const categoryPath = path.join(postsDirectory, category);

  if (!fs.existsSync(categoryPath)) {
    return [];
  }

  const files = fs.readdirSync(categoryPath);
  const posts = files
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.(mdx|md)$/, '');
      const fullPath = path.join(categoryPath, file);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        category,
        title: data.title || slug,
        date: data.date || '',
        description: data.description || '',
        ...data,
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1)); // 최신순 정렬

  return posts;
}

/**
 * 모든 포스트 가져오기 (ALL용)
 */
export function getAllPosts(): Post[] {
  const categories = getCategories();
  const allPosts: Post[] = [];

  categories.forEach((category) => {
    const posts = getPostsByCategory(category);
    allPosts.push(...posts);
  });

  // 날짜순 정렬
  return allPosts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

/**
 * 특정 포스트 가져오기 (상세 페이지용)
 */
export function getPostBySlug(category: string, slug: string): PostWithContent | null {
  try {
    const fullPath = path.join(postsDirectory, category, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      const mdPath = path.join(postsDirectory, category, `${slug}.md`);
      if (!fs.existsSync(mdPath)) {
        return null;
      }
      return getPostContent(mdPath, category, slug);
    }

    return getPostContent(fullPath, category, slug);
  } catch (error) {
    console.error('getPostBySlug ERROR: error');
    return null;
  }
}

function getPostContent(fullPath: string, category: string, slug: string): PostWithContent {
  const fileContents = fs.readFileSync(fullPath, 'utf-8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    category,
    title: data.title || slug,
    date: data.date || '',
    description: data.description || '',
    content,
    ...data,
  };
}

/**
 * 카테고리별 포스트 개수 가져오기
 */
export function getPostCountByCategory(): Record<string, number> {
  const categories = getCategories();
  const counts: Record<string, number> = {};

  categories.forEach((category) => {
    counts[category] = getPostsByCategory(category).length;
  });

  return counts;
}
