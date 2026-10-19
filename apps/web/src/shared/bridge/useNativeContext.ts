// 렌더 중에 셸 컨텍스트를 읽는 훅 — 서버 렌더와 첫 렌더를 맞추려고 하이드레이션 전까지는 브라우저(null)로 본다
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { getNativeContextSnapshot } from './native-context';

export const useNativeContext = () =>
  useClientOnlyValue(getNativeContextSnapshot, null);
