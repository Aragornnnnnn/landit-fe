// 캐릭터 무대 — 대화 상대가 전신으로 서 있는 화면 전체 배경. 대화 칸은 턱 선에서 조금 아래(CHAT_TOP_LINE)에 놓인다
'use client';

import type { CSSProperties } from 'react';
import { motion } from 'motion/react';

import type { CharacterLook, Partner } from '../../model/character-look';
import type { PlayingSpeech } from '../../model/useAiSpeech';
import { PartnerCharacter } from '../character/PartnerCharacter';
import { STAGE_VIEWBOX } from '../character/parts-by-partner';
import {
  CHARACTER_BOX,
  CHAT_TOP_LINE,
  STAGE_BACKGROUND_CLASS,
  STAGE_SWAY_TURN,
} from './stage-layout';

// 아래로 갈수록 짙어지는 회색 — 대화 칸 뒤까지 깔아 말풍선이 캐릭터 옷 위에서도 떠오르게 한다(얼굴은 밝게 둔다)
const STAGE_SHADE =
  'linear-gradient(to bottom, rgb(60 60 58 / 0), rgb(60 60 58 / 0.38) 45%, rgb(50 50 48 / 0.6))';

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
 * - 자리 — 화면 흐름 안에서 대화 칸 시작선 높이만큼 차지해, 뒤따르는 대화 칸이 턱 조금 아래에서 시작한다.
 *   키보드가 올라와 자리가 모자랄 때만 먼저 줄어든다(줄어드는 비율 1000). 닫기(X)가 위에 떠 있어 그 높이 밑으로는 줄지 않는다.
 * - 배경 — 자리에서 화면 바닥까지 뻗는 그림. 대화 칸 뒤로 깔리도록 -z로 둔다(화면 루트가 isolate여야 앱 배경 위에 그려진다).
 *   크기가 화면으로 정해져 있어 contain: strict로 가둔다 — 대화 칸 글자가 바뀌어도 무대는 다시 배치·페인트하지 않는다.
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
      height: CHAT_TOP_LINE,
      minHeight: 'calc(3.5rem + max(var(--safe-area-inset-top), 8px))',
    }}
  >
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-dvh overflow-hidden [contain:strict] ${STAGE_BACKGROUND_CLASS}`}
      // 전신이라 흔들림 각도를 줄인다(STAGE_SWAY_TURN 참고) — 캐릭터 상자까지 상속된다
      style={{ '--sway-turn': STAGE_SWAY_TURN } as CSSProperties}
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
      {/* 아래 어둡게 — 몸통·다리 위에 쌓이는 말풍선과 흰 버튼 이름이 옷 색에 묻히지 않게, 대화 칸이 놓이는 아래 72%를 회색으로 눌러 준다.
          무대 그림 안에 둬서 대화 칸·버튼보다 늘 뒤에 깔린다 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[72%]"
        style={{ background: STAGE_SHADE }}
      />
    </div>
  </div>
);
