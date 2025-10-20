import Link from 'next/link';
import Image from 'next/image';
import { cn, formatDate } from '@/lib/utils';
import { Post } from '@/types';

interface BlogCardProps {
  blog: Post;
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className={cn('w-full group clay-card overflow-hidden ')}
    >
      <div className='flex flex-col'>
        {blog.thumbnail && (
          <div className='relative w-full overflow-hidden h-25 md:h-48'>
            <Image
              src={blog.thumbnail}
              alt={blog.title}
              fill
              className='object-cover transition-transform duration-300 group-hover:scale-105'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />
          </div>
        )}
        <div className='p-6 flex flex-col gap-2 flex-1'>
          <h3 className='text-lg md:text-xl font-semibold text-black group-hover:underline underline-offset-4'>
            {blog.title}
          </h3>
          <p className='text-sidebar-ring text-sm'>{blog.description}</p>
          <time className='block text-sm font-medium text-primary/50 mt-auto'>
            {formatDate(new Date(blog.date))}
          </time>
        </div>
      </div>
    </Link>
  );
}
