// 주제 고르기 — 상대가 먼저 말을 걸려면 무슨 얘기로 열지 정해야 한다
'use client';

import type { FreeTalkTopic } from '@/features/small-talk/api/free-talk';
import { Modal } from '@/shared/ui/Modal';

interface TopicPickerModalProps {
  open: boolean;
  topics: FreeTalkTopic[];
  onSelect: (topic: FreeTalkTopic) => void;
  onClose: () => void;
}

export const TopicPickerModal = ({
  open,
  topics,
  onSelect,
  onClose,
}: TopicPickerModalProps) => (
  <Modal open={open} onClose={onClose}>
    <h2 className="text-center text-base font-bold text-primary">
      어떤 주제로 대화할까요?
    </h2>
    {/* 칩 길이가 제각각이라 줄바꿈에 맡기고 가운데로 모은다.
        모달 안쪽 여백보다 조금 넓게 써야 긴 칩 셋이 한 줄에 들어간다 */}
    <div className="-mx-2 mt-4 flex flex-wrap justify-center gap-2">
      {topics.map((topic) => (
        <button
          key={topic.topicId}
          type="button"
          onClick={() => onSelect(topic)}
          className="rounded-full bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition-transform active:scale-95"
        >
          {topic.displayName}
        </button>
      ))}
    </div>
  </Modal>
);
