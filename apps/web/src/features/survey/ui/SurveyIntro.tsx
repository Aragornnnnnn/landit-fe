'use client';

// 설문 안내 — 얼마나 걸리고 왜 묻는지 먼저 못 박는다. 이유를 알아야 끝까지 간다
import { Button } from '@/shared/ui/Button';

import { SpeechBubble } from './SpeechBubble';

export const SurveyIntro = ({ onStart }: { onStart: () => void }) => (
  <>
    <div className="flex flex-1 flex-col pt-7">
      <h1 className="text-3xl leading-[1.3] font-black tracking-normal break-keep">
        2분만 내주시면
        <br />
        랜딧이 더 좋아져요
      </h1>
      {/* 제목이 이유를 말했으니 여기선 무엇을 물을지만 — 두 줄을 넘기면 안 읽고 넘긴다 */}
      <p className="mt-4 text-xl leading-snug font-bold text-muted-foreground">
        쓰면서 느낀 점을
        <br />
        솔직하게 들려주세요
      </p>

      <div className="flex flex-1 items-center justify-center">
        <SpeechBubble />
      </div>
    </div>

    <Button onClick={onStart}>시작하기</Button>
  </>
);
