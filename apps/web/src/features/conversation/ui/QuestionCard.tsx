// 질문 카드 — 상대 발화가 말하는 속도에 맞춰 글자가 생성되듯 촤르륵 나타나고, 끝나면 한글 해석이 이어서 뜬다
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

import { speechTypingMs } from '../model/pacing';
import { TypingCursor } from './TypingCursor';

interface QuestionCardProps {
  question: string;
  translation: string | null;
  speaking: boolean;
}

export const QuestionCard = ({
  question,
  translation,
  speaking,
}: QuestionCardProps) => {
  // 진행값이 어느 질문 것인지 함께 저장한다 — 질문이 바뀐 첫 프레임에 이전 값이 새어 나오지 않도록
  const [typed, setTyped] = useState({ question, count: 0 });
  const count = typed.question === question ? typed.count : 0;

  useEffect(() => {
    if (!speaking) return;
    const chars = question.length;
    const duration = speechTypingMs(question);
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const count = Math.ceil(t * chars);
      // 글자 수가 그대로면 이전 state를 반환해 프레임마다의 불필요한 리렌더를 막는다
      setTyped((prev) =>
        prev.question === question && prev.count === count
          ? prev
          : { question, count },
      );
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, question]);

  // 발화 중이 아니면 무조건 전문 — 유저 선발화 안내 카드, 그리고 rAF가 끊긴 채(백그라운드 탭) 발화가 끝난 경우의 복구
  const visibleCount = speaking ? count : question.length;
  const typing = speaking && visibleCount < question.length;
  const done = visibleCount >= question.length;

  return (
    <motion.div
      key={question}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full rounded-[28px] rounded-tl-md bg-card px-6 py-6 shadow-lg shadow-black/5"
    >
      <p className="min-h-14 text-[21px] leading-snug font-bold text-foreground">
        {question.slice(0, visibleCount)}
        {typing && <TypingCursor />}
      </p>
      {translation && (
        <motion.p
          initial={false}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 text-sm leading-relaxed text-muted-foreground"
        >
          {translation}
        </motion.p>
      )}
    </motion.div>
  );
};
