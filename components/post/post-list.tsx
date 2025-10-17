import { Post } from '@/lib/posts';
import { format } from 'date-fns';
import Link from 'next/link';

interface PostListProps {
  posts: Post[];
  selectedCategory: string;
}

export function PostList({ posts, selectedCategory }: PostListProps) {
  if (posts.length === 0) {
    return <div className='text-center py-12 text-muted-foreground'>포스트가 없습니다.</div>;
  }
  return (
    <div className='space-y-4'>
      <h3 className='text-xl font-bold '>
        📂 {selectedCategory === 'all' ? 'All Posts' : selectedCategory} ({posts.length})
      </h3>

      <div className='grid gap-6'>
        {posts.map((post) => (
          <PostCard key={`${post.category}-${post.slug}`} post={post} />
        ))}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/post/${post.slug}`} className='block p-6 rounded-lg border bg-card hover:shadow-md transition-shadow'>
      <div className='flex items-center gap-2 mb-2'>
        <span className='text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded'>{post.category}</span>
        {post.date && <time className='text-sm text-muted-foreground'>{format(new Date(post.date), 'yyyy년 MM월 dd일')}</time>}
      </div>

      <h3 className='text-xl font-bold mb-2 hover:text-primary transition-colors'>{post.title}</h3>

      {post.description && <p className='text-muted-foreground line-clamp-2'>{post.description}</p>}
    </Link>
  );
}
