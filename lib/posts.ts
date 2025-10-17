// 데이터 구조 및 유틸리티 함수

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Callout } from '@/components/mdx/callout';

// ==================== 타입 정의 ====================
export interface Post {
  slug: string;
  category: string;
  title: string;
  date: string;
  description?: string;
}

export interface PostMeta {
  title: string;
  description?: string;
  createdAt: string;
  thumbnail?: string;
}

export interface PostContent {
  slug: string;
  category: string;
  meta: PostMeta;
  content: React.ReactElement;
}

// ==================== 상수 ====================
const postsDirectory = path.join(process.cwd(), 'posts');
console.log('⚠️ postsDirectory', postsDirectory);

// ================== 카테고리 관련 ==================
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

// ==================== 포스트 목록 ====================
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

// ==================== 포스트 상세 ====================
/**
 * 특정 포스트 가져오기 (상세 페이지용)
 */
export async function getPostContent(category: string, slug: string): Promise<PostContent | null> {
  try {
    const filePath = path.join(postsDirectory, category, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      // .md 파일도 체크
      const mdPath = path.join(postsDirectory, category, `${slug}.md`);
      if (!fs.existsSync(mdPath)) {
        return null;
      }
      return await compileMDXFile(mdPath, category, slug);
    }

    return await compileMDXFile(filePath, category, slug);
  } catch (error) {
    console.error('Error reading MDX file:', error);
    return null;
  }
}

/**
 * MDX 파일 컴파일 (내부 헬퍼 함수)
 */
async function compileMDXFile(filePath: string, category: string, slug: string): Promise<PostContent> {
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const { content, frontmatter } = await compileMDX<PostMeta>({
    source: fileContents,
    components: {
      Callout,
    },
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [
          remarkGfm, // GitHub Flavored Markdown
          remarkBreaks, // 줄바꿈 지원
        ],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: {
                dark: 'github-dark-dimmed',
                light: 'github-light',
              },
              keepBackground: false,
              defaultLang: 'plaintext',
              onVisitLine(node: { children: { type: string; value: string }[] }) {
                // 빈 줄 처리
                if (node.children.length === 0) {
                  node.children = [{ type: 'text', value: ' ' }];
                }
              },
              onVisitHighlightedLine(node: { properties: { className?: string[] } }) {
                node.properties.className?.push('highlighted');
              },
              onVisitHighlightedChars(node: { properties: { className?: string[] } }) {
                node.properties.className = ['word'];
              },
            },
          ],
        ],
      },
    },
  });

  return {
    slug,
    category,
    meta: frontmatter,
    content,
  };
}

/**
 * slug만으로 포스트 찾기 (category 정보 없을 때)
 */
export async function getPostBySlug(slug: string): Promise<PostContent | null> {
  const categories = getCategories();

  // 모든 카테고리를 순회하며 slug에 해당하는 포스트 찾기
  for (const category of categories) {
    const post = await getPostContent(category, slug);
    if (post) {
      return post;
    }
  }

  return null;
}

// ==================== SSG 관련 ====================
/**
 * 모든 포스트 slug 가져오기 (generateStaticParams용)
 */
export function getAllSlugs(): { slug: string }[] {
  const categories = getCategories();
  const slugs: { slug: string }[] = [];

  categories.forEach((category) => {
    const categoryPath = path.join(postsDirectory, category);
    const files = fs.readdirSync(categoryPath);

    files
      .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
      .forEach((file) => {
        const slug = file.replace(/\.(mdx|md)$/, '');
        slugs.push({ slug });
      });
  });

  return slugs;
}
