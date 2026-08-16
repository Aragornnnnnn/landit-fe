// 상대별 파츠 — 캐릭터를 그리는 컴포넌트들이 그림 파일을 여기서 찾는다.
// 따로 두는 이유 — 이 표가 PartnerCharacter 안에 있으면, 한 컷만 그리면 되는 쪽도
// 립싱크·랜덤 모션 코드까지 함께 불러오게 된다
import type { ComponentType, SVGProps } from 'react';

import type { Partner } from '../../model/character-look';
import { ChloeParts } from './ChloeParts';
import { MarcoParts } from './MarcoParts';
import { TeddyParts } from './TeddyParts';

/**
 * 캐릭터별 파츠 — 생성 스크립트 산출물을 여기에 등록한다.
 * Record라 Partner에 캐릭터를 추가하면 여기 빠진 자리를 타입 검사가 잡아준다.
 */
export const PARTS: Record<Partner, ComponentType<SVGProps<SVGSVGElement>>> = {
  marco: MarcoParts,
  chloe: ChloeParts,
  teddy: TeddyParts,
};
