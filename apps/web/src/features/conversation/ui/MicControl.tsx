// 마이크 컨트롤 — 대기(말하기·키보드) ↔ 듣는 중(음성: X·■ / 키보드: 입력창)을 전환한다
'use client';

import { motion } from 'motion/react';

import { useLabsStore } from '@/shared/store/labs-store';
import {
  ArrowRightIcon,
  CloseIcon,
  KeyboardIcon,
  MicIcon,
  StopIcon,
} from '@/shared/ui/Icons';

import type { ConversationPhase } from '../model/conversationMachine';

interface MicControlProps {
  phase: ConversationPhase;
  keyboardMode: boolean;
  transcript: string;
  onPress: () => void;
  onKeyboard: () => void;
  onTranscriptChange: (value: string) => void;
  onSubmitText: () => void;
  onCancel: () => void;
  onDone: () => void;
}

export const MicControl = ({
  phase,
  keyboardMode,
  transcript,
  onPress,
  onKeyboard,
  onTranscriptChange,
  onSubmitText,
  onCancel,
  onDone,
}: MicControlProps) => {
  const listening = phase === 'USER_LISTENING';
  // 발화·속마음 중엔 누를 수 없게 잠근다 — 자리는 유지해 레이아웃이 튀지 않게
  const disabled = phase !== 'USER_IDLE' && !listening;
  // 타이핑 입력은 실험실 기능 — 켠 사용자에게만 키보드 전환 버튼을 보여준다 (기본은 말하기만)
  const typingInputEnabled = useLabsStore((state) => state.typingInputEnabled);

  // 키보드로 입력 중 — 채팅창(텍스트 입력)을 띄운다
  if (listening && keyboardMode) {
    return (
      <div className="flex h-36 flex-none items-center gap-2 px-5">
        <button
          onClick={onCancel}
          aria-label="입력 취소"
          className="flex size-11 flex-none items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-95"
        >
          <CloseIcon size={22} strokeWidth={2.5} />
        </button>
        <input
          autoFocus
          value={transcript}
          onChange={(event) => onTranscriptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && transcript.trim()) onSubmitText();
          }}
          placeholder="답변을 입력하세요"
          className="min-w-0 flex-1 rounded-full border border-border bg-muted/50 px-5 py-3 text-base text-foreground outline-none focus:border-primary"
        />
        <button
          onClick={onSubmitText}
          disabled={!transcript.trim()}
          aria-label="답변 전송"
          className="flex size-12 flex-none items-center justify-center rounded-full bg-primary text-white transition-opacity active:scale-95 disabled:opacity-30"
        >
          <ArrowRightIcon size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-36 flex-none flex-col items-center justify-center gap-2">
      {/* 컨트롤은 즉시 전환한다 — exit 애니메이션 대기는 입력 지연으로 느껴진다 */}
      {listening ? (
        <motion.div
          key="listening"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-sm font-medium text-muted-foreground">
            말을 듣고 있어요..
          </p>
          <div className="flex items-center gap-8">
            <button
              onClick={onCancel}
              aria-label="답변 중단"
              className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive active:scale-95"
            >
              <CloseIcon size={26} strokeWidth={2.5} />
            </button>
            <button
              onClick={onDone}
              aria-label="답변 완료"
              className="relative flex size-20 items-center justify-center rounded-full bg-primary text-white active:scale-95"
            >
              {/* 듣는 중임을 알리는 바깥 링 펄스 */}
              <motion.span
                className="absolute inset-0 rounded-full bg-primary/30"
                animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <StopIcon size={28} />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="relative flex flex-col items-center gap-2"
        >
          {/* 마이크는 가운데 고정, 키보드 아이콘은 오른쪽에 작게 — 누르면 타이핑 입력으로 전환 */}
          {typingInputEnabled && (
            <button
              onClick={onKeyboard}
              disabled={disabled}
              aria-label="키보드로 입력"
              className="absolute top-1.5 left-[calc(50%+3rem)] flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground transition-opacity active:scale-95 disabled:opacity-30"
            >
              <KeyboardIcon size={22} />
            </button>
          )}
          <button
            onClick={onPress}
            disabled={disabled}
            aria-label="말하기"
            className="flex size-20 items-center justify-center rounded-full bg-primary text-white transition-opacity active:scale-95 disabled:opacity-30"
          >
            <MicIcon size={34} />
          </button>
          <p
            className={`text-base font-bold ${disabled ? 'text-primary/30' : 'text-primary'}`}
          >
            말하기
          </p>
        </motion.div>
      )}
    </div>
  );
};
