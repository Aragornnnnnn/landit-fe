'use client';

// 이 기기가 봤는지를 화면이 지켜본다 — 다른 화면에서 mark()하면 여기도 곧바로 다시 그린다.
// 서버엔 기록이 없어 "본 것"으로 답한다. 아직 안 본 사람에게 표시가 한 박자 늦게 붙는 편이,
// 이미 본 사람에게 표시가 잠깐 번쩍였다 사라지는 것보다 낫다
import { useSyncExternalStore } from 'react';

import type { SeenFlag } from './seen-flag';

const seenOnServer = () => true;

export const useSeenFlag = (flag: SeenFlag) =>
  useSyncExternalStore(flag.subscribe, flag.has, seenOnServer);
