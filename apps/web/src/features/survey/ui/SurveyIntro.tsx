'use client';

// 설문 안내 — 얼마나 걸리고 뭘 받는지 먼저 못 박는다. 보상을 알아야 끝까지 간다
import { Button } from '@/shared/ui/Button';

import { GiftBox } from './GiftBox';

export const SurveyIntro = ({ onStart }: { onStart: () => void }) => (
  <>
    <div className="flex flex-1 flex-col pt-7">
      <h1 className="text-3xl leading-[1.3] font-black tracking-normal break-keep">
        2분만 내주시면
        <br />한 달 무료 이용권을 드려요
      </h1>
      {/* 보상은 제목이 말했으니 여기선 이유만 — 두 줄을 넘기면 안 읽고 넘긴다 */}
      <p className="mt-4 text-xl leading-snug font-bold text-muted-foreground">
        더 나은 랜딧을 위해
        <br />
        여러분의 생각이 필요해요
      </p>

      <div className="flex flex-1 items-center justify-center">
        <GiftBox />
      </div>
    </div>

    <Button onClick={onStart}>시작하기</Button>
  </>
);
