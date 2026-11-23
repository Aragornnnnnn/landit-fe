// 캐릭터 무대 — 대화 상대가 전신으로 서 있는 화면 전체 배경. 대화 칸은 턱 선(STAGE_CHIN_LINE) 아래에 놓인다
'use client';

import { motion } from 'motion/react';

import type { CharacterLook, Partner } from '../../model/character-look';
import type { PlayingSpeech } from '../../model/useAiSpeech';
import { PartnerCharacter } from '../character/PartnerCharacter';
import { STAGE_VIEWBOX } from '../character/parts-by-partner';
import {
  CHARACTER_BOX,
  STAGE_BACKGROUND_CLASS,
  STAGE_CHIN_LINE,
} from './stage-layout';

/**
 * partner는 세션 TTS 음성 성별을 따르고, look은 대화 단계에 맞춘 자세와 표정,
 * speech는 재생 중인 발화로 입모양을 소리에 맞추는 데 쓴다. 셋 다 그대로 캐릭터에 넘긴다.
 */
interface CharacterStageProps {
  partner: Partner;
  look: CharacterLook;
  speech: PlayingSpeech | null;
}

/**
 * 두 겹이다.
 * - 자리 — 화면 흐름 안에서 턱 선 높이만큼 차지해, 뒤따르는 대화 칸이 턱 바로 아래에서 시작한다.
 *   키보드가 올라와 자리가 모자랄 때만 먼저 줄어든다(줄어드는 비율 1000). 닫기(X)가 위에 떠 있어 그 높이 밑으로는 줄지 않는다.
 * - 배경 — 자리에서 화면 바닥까지 뻗는 그림. 대화 칸 뒤로 깔리도록 -z로 둔다(화면 루트가 isolate여야 앱 배경 위에 그려진다).
 *   자리가 줄어도 캐릭터는 그대로다 — 화면 위 끝 기준으로 놓이기 때문이다.
 */
export const CharacterStage = ({
  partner,
  look,
  speech,
}: CharacterStageProps) => (
  <div
    className="relative w-full flex-none shrink-[1000]"
    style={{
      height: STAGE_CHIN_LINE,
      minHeight: 'calc(3.5rem + max(var(--safe-area-inset-top), 8px))',
    }}
  >
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-dvh overflow-hidden ${STAGE_BACKGROUND_CLASS}`}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="absolute left-1/2 flex justify-center"
        style={{ x: '-50%', ...CHARACTER_BOX }}
      >
        <PartnerCharacter
          partner={partner}
          look={look}
          speech={speech}
          viewBox={STAGE_VIEWBOX[partner]}
        />
      </motion.div>
    </div>
  </div>
);
