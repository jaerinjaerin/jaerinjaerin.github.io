'use client';
import Image from 'next/image';
import { motion } from 'motion/react';

export function Greeting() {
  return (
    <div className='claymorphism-rectangle text-black py-10 px-10 md:px-15 font-pretendard text-center flex flex-col gap-2 max-w-[658px] mx-auto mb-8'>
      <span className='font-extrabold text-[28px] md:text-[36px]'>
        Welcome! 🙌🏼
      </span>

      <div className='flex flex-col font-medium '>
        블로그에 오신것을 환영합니다! 주로 프론트엔드와 관련된 글들이
        올라옵니다. 그 이외의 프로젝트 회고도 자주 올라올 예정이니 재미있게
        봐주세요. 감사합니다 ☺️
      </div>

      <span>이재린이라는 사람이 궁금하다면?</span>

      <motion.button
        whileTap={{
          scale: 0.94, // 살짝 눌림
          y: 3, // 아래로 살짝 이동
          boxShadow:
            '0px 8px 16px rgba(47,107,255,0.4), inset 3px 3px 6px #4379FF, inset -6px -6px 12px #004AFF',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className='bg-card max-w-[320px] w-full mx-auto shadow-blue-glow rounded-[20px] py-4 text-white font-extrabold text-[28px] md:text-[36px] relative active:scale-95'
        onClick={() =>
          confirm(
            '🤔저에 대해서 많이 궁금하시군요! 조금만 기다려주시면 소개글을 가져올게요.'
          )
        }
      >
        Hello!
        <motion.div
          className='absolute top-1/2 left-[-20px] z-20'
          whileTap={{ rotate: -10, y: 2 }}
        >
          <Image
            src={'/images/icons/handy-touch.png'}
            alt='handy-touch icon'
            width={100}
            height={70}
          />
        </motion.div>
        <motion.div className='size-6 bg-primary opacity-90 blur-[10.5px] rounded-full absolute z-10 top-1/2 left-[64px]' />
      </motion.button>
    </div>
  );
}
