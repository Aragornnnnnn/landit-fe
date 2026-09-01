'use client';

// 예문 + 듣기 버튼 + 해석 블록 — 설명 화면과 발음 화면이 같은 사전 문법을 공유한다
import { KaraokeSentence } from './KaraokeSentence';
import { ListenButton } from './ListenButton';

interface SentenceListenBlockProps {
  sentenceText: string;
  sentenceTranslation: string;
  // 굵게 강조할 표현 구간
  highlight: string;
  onPlay: () => void;
  playing: boolean;
  // 재생 진행률 0~1 — 글자가 순서대로 물든다
  progress: number;
}

export const SentenceListenBlock = ({
  sentenceText,
  sentenceTranslation,
  highlight,
  onPlay,
  playing,
  progress,
}: SentenceListenBlockProps) => (
  <div>
    {/* 스피커는 상단 고정 — 문장이 몇 줄이든 첫 줄 기준 같은 높이에 선다 */}
    <div className="flex items-start gap-3">
      <p className="min-w-0 flex-1 text-xl leading-snug font-medium text-foreground">
        <KaraokeSentence
          text={sentenceText}
          highlight={highlight}
          progress={progress}
        />
      </p>
      <ListenButton
        playing={playing}
        onClick={onPlay}
        ariaLabel="예문 발음 듣기"
      />
    </div>
    <p className="mt-2 text-[15px] font-medium text-muted-foreground">
      {sentenceTranslation}
    </p>
  </div>
);
