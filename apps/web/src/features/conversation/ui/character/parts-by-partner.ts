// 상대별 파츠 — 캐릭터를 그리는 컴포넌트들이 그림 파일을 여기서 찾는다.
// 따로 두는 이유 — 이 표가 PartnerCharacter 안에 있으면, 한 컷만 그리면 되는 쪽도
// 립싱크·랜덤 모션 코드까지 함께 불러오게 된다
import type { ComponentType, SVGProps } from 'react';

import type { Partner } from '../../model/character-look';
import { CHLOE_LIMBS, CHLOE_VIEWBOX, ChloeParts } from './ChloeParts';
import { MARCO_LIMBS, MARCO_VIEWBOX, MarcoParts } from './MarcoParts';
import type { PartLayer } from './part-layer';
import { TEDDY_LIMBS, TEDDY_VIEWBOX, TeddyParts } from './TeddyParts';

export type { PartLayer };

/** layer를 주면 그 층만, 생략하면 한 장으로 그린다 */
type PartsProps = SVGProps<SVGSVGElement> & { layer?: PartLayer };

/**
 * 캐릭터별 파츠 — 생성 스크립트 산출물을 여기에 등록한다.
 * Record라 Partner에 캐릭터를 추가하면 여기 빠진 자리를 타입 검사가 잡아준다.
 */
export const PARTS: Record<Partner, ComponentType<PartsProps>> = {
  marco: MarcoParts,
  chloe: ChloeParts,
  teddy: TeddyParts,
};

/** 머리 다음에 얹히는 캐릭터별 층(팔) — 없으면 빈 목록이다 */
export const LIMBS: Record<Partner, readonly PartLayer[]> = {
  marco: MARCO_LIMBS,
  chloe: CHLOE_LIMBS,
  teddy: TEDDY_LIMBS,
};

/** 캐릭터별 원래 그림 영역 — 소비처가 viewBox를 안 넘기면 이걸 쓴다 */
export const VIEWBOX: Record<Partner, string> = {
  marco: MARCO_VIEWBOX,
  chloe: CHLOE_VIEWBOX,
  teddy: TEDDY_VIEWBOX,
};
