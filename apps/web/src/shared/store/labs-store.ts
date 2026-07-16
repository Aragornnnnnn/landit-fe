'use client';

// 실험실 설정 — 기본 꺼짐인 실험 기능 플래그를 localStorage에 유지한다 (내 정보 > 실험실에서 토글)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LabsState {
  // 대화에서 말하기 대신 타이핑 입력도 허용할지 — 기본은 말하기만
  typingInputEnabled: boolean;
  setTypingInputEnabled: (enabled: boolean) => void;
}

export const useLabsStore = create<LabsState>()(
  persist(
    (set) => ({
      typingInputEnabled: false,
      setTypingInputEnabled: (enabled) => set({ typingInputEnabled: enabled }),
    }),
    { name: 'landit-labs' },
  ),
);
