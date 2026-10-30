'use client';

// 설문 안내 — 왜 묻는지 먼저 못 박는다. 이유를 알아야 끝까지 간다. 문구는 설문마다 surveys.ts에 있다
import { Button } from '@/shared/ui/Button';

import type { SurveyIntroCopy } from '../model/surveys';
import { SpeechBubble } from './SpeechBubble';

export const SurveyIntro = ({
  copy,
  onStart,
}: {
  copy: SurveyIntroCopy;
  onStart: () => void;
}) => (
  <>
    <div className="flex flex-1 flex-col pt-7">
      <h1 className="text-3xl leading-[1.3] font-black tracking-normal break-keep whitespace-pre-line">
        {copy.title}
      </h1>
      {/* 제목이 이유를 말했으니 여기선 무엇을 물을지만 — 두 줄을 넘기면 안 읽고 넘긴다 */}
      <p className="mt-4 text-xl leading-snug font-bold whitespace-pre-line text-muted-foreground">
        {copy.subtitle}
      </p>

      <div className="flex flex-1 items-center justify-center">
        <SpeechBubble />
      </div>
    </div>

    <Button onClick={onStart}>시작하기</Button>
  </>
);
