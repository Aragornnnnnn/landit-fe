// 주제 고르기 — 상대가 먼저 말을 걸려면 무슨 얘기로 열지 정해야 한다.
// 보여주는 몇 개는 주제 풀에서 무작위로 뽑힌 것이라, 마음에 드는 게 없으면 다시 받아 볼 수 있다
'use client';

import { useEffect, useRef, useState } from 'react';

import type { SmallTalkTopic } from '@/features/small-talk/api/small-talk';
import { RefreshIcon } from '@/shared/ui/Icons';
import { Modal } from '@/shared/ui/Modal';

// 아이콘이 한 바퀴 도는 시간 — 이 값이 애니메이션 길이이자 버튼이 잠기는 시간이다.
// CSS에는 --spin-ms로 내려보낸다 (두 곳에 적어 두면 어긋나는 순간 잠금과 회전이 따로 논다)
const SPIN_MS = 550;

interface TopicPickerModalProps {
  open: boolean;
  // 누구와 얘기할지는 이미 골랐다 — 이름을 불러 어느 상대의 주제인지 이어 준다
  partnerName: string;
  topics: SmallTalkTopic[];
  // 새 주제를 받아오는 중 — 보고 있던 칩은 그대로 고를 수 있고, 새로고침만 잠긴다
  refreshing: boolean;
  onRefresh: () => void;
  onSelect: (topic: SmallTalkTopic) => void;
  onClose: () => void;
}

export const TopicPickerModal = ({
  open,
  partnerName,
  topics,
  refreshing,
  onRefresh,
  onSelect,
  onClose,
}: TopicPickerModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    label={`${partnerName}와 어떤 주제로 대화할까요?`}
  >
    <TopicPicker
      partnerName={partnerName}
      topics={topics}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onSelect={onSelect}
    />
  </Modal>
);

// 모달 안쪽 — 닫히면 Modal이 이 안을 통째로 걷어낸다. 회전·잠금 같은 한 번의 연출 상태를
// 여기 두어야 다음에 열 때 따라오지 않는다 (바깥은 닫혀도 계속 마운트돼 있다)
const TopicPicker = ({
  partnerName,
  topics,
  refreshing,
  onRefresh,
  onSelect,
}: Omit<TopicPickerModalProps, 'open' | 'onClose'>) => {
  // 누른 횟수 — 아이콘을 새로 마운트해 한 바퀴 애니메이션을 다시 태운다.
  // 응답이 빨라도 늦어도 "눌렀다"는 것은 똑같이 한 바퀴로 보인다
  const [spins, setSpins] = useState(0);
  // 한 바퀴가 끝나기 전에는 다시 못 누른다 — 연달아 누르면 주제가 읽기도 전에 갈리고,
  // 줄 수가 바뀌며 모달 높이가 튀어 방금 누른 버튼이 손 밑에서 움직인다
  const [cooling, setCooling] = useState(false);
  const coolingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (coolingTimer.current) clearTimeout(coolingTimer.current);
    },
    [],
  );

  const requestRefresh = () => {
    setSpins((count) => count + 1);
    setCooling(true);
    coolingTimer.current = setTimeout(() => setCooling(false), SPIN_MS);
    onRefresh();
  };

  return (
    <>
      {/* 왼쪽 제목 ↔ 오른쪽 닫기로 한 줄을 잡는다. 오른쪽 여백은 X 자리를 비켜 준다.
          색은 검정 — 눌러야 할 건 칩이라 주황은 그쪽에 양보한다 */}
      <h2 className="pr-8 text-[17px] font-bold text-foreground">
        {partnerName}와 어떤 주제로 대화할까요?
      </h2>
      {/* 칩 길이가 제각각이라 줄바꿈에 맡기고 가운데로 모은다.
          받아오는 동안에도 칩을 비우지 않는다 — 비우면 모달 높이가 접혔다 펴진다.
          주제가 갈리면 줄째로 새로 마운트돼(key) 칩이 차례로 올라온다 */}
      <div
        key={topics.map((topic) => topic.topicId).join()}
        className="mt-5 flex flex-wrap justify-center gap-2"
      >
        {topics.map((topic, index) => (
          <button
            key={topic.topicId}
            type="button"
            onClick={() => onSelect(topic)}
            style={{ '--i': index } as React.CSSProperties}
            className="animate-chip-in rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform active:scale-95"
          >
            {topic.displayName}
          </button>
        ))}
      </div>
      {/* 주제를 바꾸는 길 — 칩을 고르는 것이 주 행동이라 그 아래 잔글씨로 둔다 */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          disabled={refreshing || cooling}
          onClick={requestRefresh}
          className="flex items-center gap-1.5 px-2 py-1 text-[13px] font-semibold text-muted-foreground active:opacity-60 disabled:opacity-40"
        >
          <RefreshIcon
            key={spins}
            size={14}
            style={{ '--spin-ms': `${SPIN_MS}ms` } as React.CSSProperties}
            className={spins > 0 ? 'animate-spin-turn' : undefined}
          />
          다른 주제 보기
        </button>
      </div>
    </>
  );
};
