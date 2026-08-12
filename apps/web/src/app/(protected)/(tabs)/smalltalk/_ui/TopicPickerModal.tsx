// 주제 고르기 — 상대가 먼저 말을 걸려면 무슨 얘기로 열지 정해야 한다
'use client';

import type { FreeTalkTopic } from '@/features/small-talk/api/free-talk';
import { Modal } from '@/shared/ui/Modal';

interface TopicPickerModalProps {
  open: boolean;
  // 누구와 얘기할지는 이미 골랐다 — 이름을 불러 어느 상대의 주제인지 이어 준다
  partnerName: string;
  topics: FreeTalkTopic[];
  onSelect: (topic: FreeTalkTopic) => void;
  onClose: () => void;
}

export const TopicPickerModal = ({
  open,
  partnerName,
  topics,
  onSelect,
  onClose,
}: TopicPickerModalProps) => (
  <Modal open={open} onClose={onClose}>
    {/* 왼쪽 제목 ↔ 오른쪽 닫기로 한 줄을 잡는다. 오른쪽 여백은 X 자리를 비켜 준다.
        색은 검정 — 눌러야 할 건 칩이라 주황은 그쪽에 양보한다 */}
    <h2 className="pr-8 text-[17px] font-bold text-foreground">
      {partnerName}와 어떤 주제로 대화할까요?
    </h2>
    {/* 칩 길이가 제각각이라 줄바꿈에 맡기고 가운데로 모은다 */}
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {topics.map((topic) => (
        <button
          key={topic.topicId}
          type="button"
          onClick={() => onSelect(topic)}
          className="rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform active:scale-95"
        >
          {topic.displayName}
        </button>
      ))}
    </div>
  </Modal>
);
