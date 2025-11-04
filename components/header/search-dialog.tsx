'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { SearchPost } from './header-client';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posts: SearchPost[];
}

export function SearchDialog({ open, onOpenChange, posts }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchPost[]>([]);
  const router = useRouter();

  // 클라이언트 측 검색 실행
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim().length === 0) {
        setResults([]);
        return;
      }

      const lowerQuery = searchQuery.toLowerCase();
      const searchResults = posts
        .filter((post) => {
          const title = post.title?.toLowerCase() || '';
          const description = post.description?.toLowerCase() || '';
          return title.includes(lowerQuery) || description.includes(lowerQuery);
        })
        .slice(0, 5); // 최대 5개만

      setResults(searchResults);
    },
    [posts]
  );

  // 디바운스된 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // 검색 결과 클릭 핸들러
  const handleResultClick = (slug: string) => {
    router.push(`/blog/${slug}`);
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  // 다이얼로그가 닫힐 때 상태 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-2xl h-[450px] overflow-y-scroll !flex flex-col'>
        <DialogHeader>
          <DialogTitle>블로그 검색</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 flex flex-col h-full'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ' />
            <Input
              placeholder='검색어를 입력하세요...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='pl-10 placeholder:text-muted'
              autoFocus
            />
          </div>

          {query.trim().length > 0 && (
            <div className='space-y-2  pb-6'>
              {results.length === 0 ? (
                <p className='py-6 text-center text-sm m-auto'>
                  검색 결과가 없습니다.
                </p>
              ) : (
                <div className='space-y-2'>
                  <p className='text-sm '>{results.length}개의 결과</p>
                  <div className='space-y-2'>
                    {results.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleResultClick(result.slug)}
                        className='w-full rounded-lg border-[1px] border-primary-foreground p-4 text-left transition-colors hover:bg-accent'
                      >
                        <h3 className='mb-1 font-semibold'>{result.title}</h3>
                        {result.description && (
                          <p className='text-xs '>{result.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {query.trim().length === 0 && (
            <p className='py-6 text-center text-sm m-auto'>
              검색어를 입력하면 블로그 글을 검색할 수 있습니다.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
