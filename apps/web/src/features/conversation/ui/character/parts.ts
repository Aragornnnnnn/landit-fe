// 캐릭터별 파츠 등록부 — 움직이는 캐릭터와 정지 초상이 같은 그림을 나눠 쓴다.
// 따로 두는 이유 — 초상은 한 컷만 그리는데 등록부가 캐릭터 파일에 있으면 립싱크·랜덤 모션까지 딸려 온다
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
