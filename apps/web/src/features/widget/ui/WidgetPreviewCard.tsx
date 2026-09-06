// 위젯 미리보기 — 설치 안내가 실제 위젯 프리뷰(OS 위젯 갤러리에 뜨는 그 그림)를 그대로 보여준다.
// mobile이 쓰는 프리뷰 썸네일을 웹에도 복제해 둔다 — 앱 간 에셋 공유가 안 돼서 같은 파일을 양쪽에 둔다
'use client';

import Image from 'next/image';

import previewMedium from '../assets/preview-medium.webp';
import previewSmall from '../assets/preview-small.webp';

// 4×2 프리뷰의 세로/가로 비 (원본 1014×474) — width만 받아 높이를 맞춘다
const MEDIUM_RATIO = 474 / 1014;

// 2×2 스트릭 위젯 프리뷰
export const WidgetPreviewSmall = ({ size = 140 }: { size?: number }) => (
  <Image
    src={previewSmall}
    alt=""
    width={size}
    height={size}
    className="rounded-[24px]"
  />
);

// 4×2 카드 도착 위젯 프리뷰
export const WidgetPreviewMedium = ({ width = 214 }: { width?: number }) => (
  <Image
    src={previewMedium}
    alt=""
    width={width}
    height={Math.round(width * MEDIUM_RATIO)}
    className="rounded-[16px]"
  />
);
