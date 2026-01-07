import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { Post } from '@/types';
import { Eye } from 'lucide-react';

interface BlogCardProps {
  blog: Post;
  featured?: boolean;
}

export function BlogCard({ blog, featured = false }: BlogCardProps) {
  // Featured 카드 (첫 2개 - 세로 레이아웃)
  if (featured) {
    return (
      <Link
        href={`/blog/${blog.slug}`}
        className='w-full border-2 border-gray-200 rounded-xl overflow-hidden bg-white'
      >
        <div className='flex flex-col h-full'>
          {blog.thumbnail && (
            <div className='relative w-full aspect-[16/9] overflow-hidden'>
              <Image
                src={blog.thumbnail}
                alt={blog.title}
                fill
                className='object-cover'
                sizes='(max-width: 768px) 100vw, 50vw'
              />
            </div>
          )}
          <div className='flex flex-col gap-4 p-8'>
            <div className='flex justify-between items-center gap-4'>
              {blog.tags[0] && (
                <span className='flex items-center gap-1.5 text-sm font-bold text-gray-900'>
                  <span className='w-5 h-5 rounded bg-primary/20 flex items-center justify-center'>
                    <span className='w-2 h-2 rounded bg-primary' />
                  </span>
                  {blog.tags[0]}
                </span>
              )}
              <time className='text-sm text-gray-500'>
                {formatDate(new Date(blog.date))}
              </time>
            </div>
            <div className='flex flex-col gap-2'>
              <h3 className='text-xl md:text-2xl font-semibold text-gray-900 line-clamp-2'>
                {blog.title}
              </h3>
              {blog.description && (
                <p className='text-sm text-gray-600 line-clamp-2'>
                  {blog.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // 일반 카드 (나머지 - 가로 레이아웃)
  return (
    <article className='overflow-hidden flex w-full h-full relative border-2 rounded-xl py-6 px-8 sm:flex-row flex-col bg-white border-gray-200 text-gray-900'>
      {/* 이미지 섹션 */}
      {blog.thumbnail && (
        <div className='shrink-0 sm:w-[160px] xl:w-[260px]'>
          <div className='aspect-[258/145] overflow-hidden relative rounded-md'>
            <Image
              src={blog.thumbnail}
              alt={blog.title}
              fill
              className='object-cover w-full h-full'
              sizes='(max-width: 640px) 100vw, 260px'
            />
          </div>
        </div>
      )}

      {/* 콘텐츠 섹션 */}
      <div className='flex h-full gap-4 justify-between w-full mt-6 sm:mt-0 flex-col sm:ml-12'>
        {/* 카테고리 + 날짜 */}
        <div className='flex justify-between items-center gap-4'>
          {blog.tags[0] && (
            <span className='flex items-center gap-1.5 text-sm font-bold text-gray-900'>
              <span className='w-5 h-5 rounded bg-primary/20 flex items-center justify-center'>
                <span className='w-2 h-2 rounded bg-primary' />
              </span>
              {blog.tags[0]}
            </span>
          )}
          <time className='text-sm text-gray-500 shrink-0'>
            {formatDate(new Date(blog.date))}
          </time>
        </div>

        {/* 제목 + 설명 */}
        <div className='flex flex-col gap-2 flex-grow'>
          <Link
            href={`/blog/${blog.slug}`}
            className='after:absolute after:inset-0'
          >
            <h2 className='text-xl 2xl:text-2xl font-semibold max-w-md line-clamp-2'>
              {blog.title}
            </h2>
          </Link>
          {blog.description && (
            <p className='text-sm text-gray-600 line-clamp-2'>
              {blog.description}
            </p>
          )}
        </div>

        {/* 푸터: 작성자 + 조회수 */}
        <footer className='flex items-center'>
          {blog.author && (
            <div className='relative z-10'>
              <div className='flex items-center gap-2 text-sm'>
                <span className='py-1'>By {blog.author}</span>
              </div>
            </div>
          )}
          {blog.viewCount !== undefined && (
            <div className='flex items-center justify-end grow text-sm font-bold gap-1'>
              <Eye className='w-4 h-4' />
              {blog.viewCount.toLocaleString()}
            </div>
          )}
        </footer>
      </div>
    </article>
  );
}
