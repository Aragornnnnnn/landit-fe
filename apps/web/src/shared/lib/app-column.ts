'use client';

// 앱 컬럼 — 화면 가운데 430px 세로 띠가 앱의 전부다. 이 띠를 통째로 덮는 오버레이가
// 기준점을 찾는 곳. 뷰포트를 덮으면 데스크톱에서 좌우 여백까지 덮여 시안과 어긋난다
import { useClientOnlyValue } from './useClientOnlyValue';

export const APP_COLUMN_ID = 'app-column';

// 오버레이를 실어 보낼 자리. 서버 렌더에선 없으므로 null이고, 붙은 뒤에만 값이 생긴다
export const useAppColumn = () =>
  useClientOnlyValue(() => document.getElementById(APP_COLUMN_ID), null);
