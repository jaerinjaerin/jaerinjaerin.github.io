'use client';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function Greeting() {
  const fullText = 'Welcome! 👋';
  const fullTextArray = Array.from(fullText); // 이모지를 포함한 모든 문자를 올바르게 분리
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const displayText = fullTextArray.slice(0, currentIndex).join('');

  const codeString = `// journey.js

// To infinity and beyond!
export const description = {
  who: '3년차 주니어 개발자 이재린의',
  learning: '프론트엔드의 기초부터 실전 프로젝트까지',
  story: '코드 한 줄에서 시작된 본격 성장 스토리',
};
`;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isPaused) {
      // 5초간 대기 후 삭제 시작
      timeout = setTimeout(() => {
        setIsPaused(false);
        setIsTyping(false);
      }, 5000);
    } else if (isTyping) {
      // 타이핑 중
      if (currentIndex < fullTextArray.length) {
        timeout = setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
        }, 150); // 타이핑 속도
      } else {
        // 타이핑 완료, 일시정지 시작
        setIsPaused(true);
      }
    } else {
      // 삭제 중
      if (currentIndex > 0) {
        timeout = setTimeout(() => {
          setCurrentIndex(currentIndex - 1);
        }, 100); // 삭제 속도
      } else {
        // 삭제 완료, 다시 타이핑 시작
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, isTyping, isPaused, fullTextArray.length]);

  return (
    <div className='claymorphism-rectangle text-black py-10 px-10 md:px-15 font-pretendard text-center flex flex-col gap-2 max-w-[658px] mx-auto mb-8'>
      <div className='font-extrabold text-[28px] md:text-[36px] inline-flex justify-center items-center min-h-[44px] md:min-h-[54px]'>
        <span>{displayText}</span>
        <motion.span
          className='ml-1'
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          |
        </motion.span>
      </div>

      <div className='max-w-none font-medium overflow-hidden rounded-lg border border-border'>
        <SyntaxHighlighter
          language='javascript'
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          }}
          showLineNumbers={false}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>

      <motion.button
        whileTap={{
          scale: 0.94, // 살짝 눌림
          y: 3, // 아래로 살짝 이동
          boxShadow: '0px 8px 16px rgba(47,107,255,0.4), inset 3px 3px 6px #4379FF, inset -6px -6px 12px #004AFF',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className='bg-card max-w-[320px] w-full mx-auto shadow-blue-glow rounded-[20px] py-4 text-white font-extrabold text-[28px] md:text-[36px] relative active:scale-95 mt-4'
        onClick={() => confirm('🤔저에 대해서 많이 궁금하시군요! 조금만 기다려주시면 소개글을 가져올게요.')}
      >
        Hello!
        <motion.div className='absolute top-1/2 left-[-20px] z-20' whileTap={{ rotate: -10, y: 2 }}>
          <Image src={'/images/icons/handy-touch.png'} alt='handy-touch icon' width={100} height={70} />
        </motion.div>
        <motion.div className='size-6 bg-primary opacity-90 blur-[10.5px] rounded-full absolute z-10 top-1/2 left-[64px]' />
      </motion.button>
    </div>
  );
}
