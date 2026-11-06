// 홈 진입 때 띄울 이벤트 공지 — 누구에게 띄울지는 서버(사용자·구독 유형 숨김)가 고르고, 여기서는 한국어 화면이 아닌 사람·이 기기가 이미 반응한 것·정기 구독자를 한 번 더 거른다.
// 반응 기록은 마운트 때 한 번 읽어 고정한다 — 이번 방문에 닫아도 시트가 닫히는 연출 중에 사라지지 않게
import { useState } from 'react';
import { useLocale } from 'next-intl';

import {
  readEventPopupDoneIds,
  unseenPopup,
} from '@/features/event-popup/model/active-popup';
import { useActivePopupQuery } from '@/features/event-popup/model/useActivePopupQuery';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import { sellsKoreaOnlyOffers } from '@/shared/i18n/locale';

import { isEventPopupAudience } from './event-popup-audience';

/** @param skip 이번 방문엔 공지를 띄우지 않는다(다른 흐름이 홈을 차지하는 방문) — 묻지도 않고, 반응 기록을 안 남겨 다음 방문에 뜬다 */
export const useActiveEventPopup = ({ skip = false } = {}) => {
  const [doneIds] = useState(readEventPopupDoneIds);
  // 공지는 지금 한국어 그림의 한국 이벤트(초대·환급)뿐이라 한국 전용 혜택과 같은 판정을 쓴다 — 아니면 건너뛴 방문처럼 묻지 않는다.
  // 언어별 공지가 생기면 서버가 언어로 고르게 하고 이 판정을 뺀다
  const locale = useLocale();
  const hidden = skip || !sellsKoreaOnlyOffers(locale);
  const { data, fetchStatus } = useActivePopupQuery({
    enabled: !hidden,
  });
  const membership = useSubscriptionQuery();
  if (hidden) return { popup: null, loading: false };
  // 이번 방문에 묻는 동안은 지난 방문의 캐시가 있어도 모르는 것으로 둔다(fetchStatus는 캐시와 상관없이 묻는 중을 말한다).
  // 실패(배포 전 404 포함)하거나 묻지 않는 조회(로그인 정보 없음)면 idle이라 기다리지 않고 공지 없이 지나간다
  const loading = fetchStatus !== 'idle' || membership.isPending;
  // 정기 구독자에게는 띄우지 않는다(서버 숨김과 겹치는 안전망) — 구독 상태를 모르면(조회 실패) 구독자일 수 있으니 띄우지 않는다
  const audience =
    membership.subscription !== null &&
    isEventPopupAudience(membership.subscription);

  return {
    popup: loading || !audience ? null : unseenPopup(data, doneIds),
    loading,
  };
};
