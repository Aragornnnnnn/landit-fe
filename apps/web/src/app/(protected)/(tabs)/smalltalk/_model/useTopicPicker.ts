// 주제 고르기 상태 — 열 때마다 주제를 다시 받고, 마음에 드는 게 없으면 새로고침으로 또 받는다.
// 서버가 주제 풀에서 무작위로 몇 개만 내려주기 때문에, 다시 받는 것이 곧 "다른 주제 보기"다
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import type { Partner } from '@/features/conversation/model/character-look';
import { track } from '@/shared/analytics';
import { showToast } from '@/shared/ui/toast';

interface TopicPickerOptions {
  // 계측용 — 어느 상대의 주제를 다시 받았는지
  partner: Partner;
  // 홈 조회를 다시 실행한다. 실패해도 보던 주제는 그대로 남는다
  refresh: () => Promise<{ isError: boolean }>;
}

export const useTopicPicker = ({ partner, refresh }: TopicPickerOptions) => {
  const [isOpen, setIsOpen] = useState(false);
  // 이 모달이 시킨 조회만 센다 — 홈 조회는 대화 후 갱신·앱 복귀로도 도는데,
  // 그때까지 새로고침이 도는 것처럼 보이면 누르지 않은 일이 화면에 나타난다
  const [refreshing, setRefreshing] = useState(false);
  // 실패는 재시도를 다 쓰고 나서야 돌아온다 — 그새 닫았거나 대화로 들어갔는지 알아야
  // 관심 없는 안내가 다른 화면 위에 뜨지 않는다 (상태가 아니라 콜백이 읽을 값이라 ref)
  const isOpenRef = useRef(false);
  useEffect(
    () => () => {
      isOpenRef.current = false;
    },
    [],
  );

  const loadTopics = async () => {
    setRefreshing(true);
    const { isError } = await refresh();
    setRefreshing(false);
    if (isError && isOpenRef.current) showToast('주제를 받아오지 못했어요');
  };

  return {
    isOpen,
    refreshing,
    // 열 때도 다시 받는다 — 캐시에 남은 주제를 다시 보여주면 어제 본 다섯 개가 또 나온다
    openPicker: () => {
      isOpenRef.current = true;
      setIsOpen(true);
      return loadTopics();
    },
    closePicker: () => {
      isOpenRef.current = false;
      setIsOpen(false);
    },
    // 눌러서 다시 받는 것만 새로고침으로 센다 (열면서 받는 것은 사용자가 고른 행동이 아니다)
    refreshTopics: () => {
      track(EVENTS.SMALL_TALK_TOPICS_REFRESHED, { partner });
      return loadTopics();
    },
  };
};
