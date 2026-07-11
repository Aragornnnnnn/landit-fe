'use client';

// 시나리오 리스트 확인 페이지 — 로그인·백엔드 없이 목 데이터로 카테고리 바·카드 덱을 눈으로 검증한다
import { useState } from 'react';

import type { ScenarioCategory } from '@/api/scenarios/list';
import { CategoryBar } from '@/features/scenario/ui/CategoryBar';
import { ScenarioList } from '@/features/scenario/ui/ScenarioList';

const mockCategories: ScenarioCategory[] = [
  {
    categoryId: 1,
    categoryName: '공항',
    displayOrder: 1,
    categoryLocked: false,
    categoryLockReason: null,
    scenarios: [
      {
        scenarioId: 11,
        starRating: 2.5,
        displayOrder: 1,
        scenarioTitle: '입국 심사 통과하기',
        briefing: '입국 심사관의 질문에 대답하고 무사히 통과해요.',
        conversationGoal: '방문 목적과 체류 기간을 말할 수 있다',
        difficulty: 'EASY',
        firstSpeaker: 'AI',
        thumbnailUrl: null,
        completed: true,
        locked: false,
        lockReason: null,
        openingPreview: {
          aiOpeningMessage: 'Good morning. May I see your passport, please?',
          aiOpeningMessageTranslation: '안녕하세요. 여권을 보여주시겠어요?',
          userOpeningInstruction: null,
          innerThought: null,
          innerThoughtType: null,
          ttsVoiceSetId: null,
        },
      },
      {
        scenarioId: 12,
        starRating: null,
        displayOrder: 2,
        scenarioTitle: '수하물 찾고 세관 신고하기',
        briefing: '짐을 찾고 세관 신고서를 제출해요.',
        conversationGoal: '수하물 위치를 묻고 신고 물품을 설명할 수 있다',
        difficulty: 'NORMAL',
        firstSpeaker: 'USER',
        thumbnailUrl: null,
        completed: false,
        locked: false,
        lockReason: null,
        openingPreview: {
          aiOpeningMessage: null,
          aiOpeningMessageTranslation: null,
          userOpeningInstruction:
            '직원에게 수하물 찾는 곳을 물어보며 시작해보세요',
          innerThought: null,
          innerThoughtType: null,
          ttsVoiceSetId: null,
        },
      },
      {
        scenarioId: 13,
        starRating: null,
        displayOrder: 3,
        scenarioTitle: '기내식 요청하기',
        briefing: '승무원에게 원하는 기내식과 음료를 요청해요.',
        conversationGoal: '',
        difficulty: 'HARD',
        firstSpeaker: 'AI',
        thumbnailUrl: null,
        completed: false,
        locked: true,
        lockReason: 'PREVIOUS_SCENARIO_NOT_COMPLETED',
        openingPreview: null,
      },
    ],
  },
  {
    categoryId: 2,
    categoryName: '카페',
    displayOrder: 2,
    categoryLocked: false,
    categoryLockReason: null,
    scenarios: [
      {
        scenarioId: 21,
        starRating: 1.0,
        displayOrder: 1,
        scenarioTitle: '커피 주문하기',
        briefing: '원하는 메뉴를 옵션까지 정확히 주문해요.',
        conversationGoal: '사이즈·온도 옵션을 붙여 주문할 수 있다',
        difficulty: 'EASY',
        firstSpeaker: 'AI',
        thumbnailUrl: null,
        completed: true,
        locked: false,
        lockReason: null,
        openingPreview: {
          aiOpeningMessage: 'Hi there! What can I get started for you?',
          aiOpeningMessageTranslation: '어서 오세요! 뭘 준비해드릴까요?',
          userOpeningInstruction: null,
          innerThought: null,
          innerThoughtType: null,
          ttsVoiceSetId: null,
        },
      },
    ],
  },
  {
    categoryId: 3,
    categoryName: '식당',
    displayOrder: 3,
    categoryLocked: true,
    categoryLockReason: '현재 사용할 수 없는 카테고리입니다.',
    scenarios: [],
  },
];

export default function ScenarioMockPage() {
  const [selectedId, setSelectedId] = useState(mockCategories[0].categoryId);

  const selected =
    mockCategories.find((category) => category.categoryId === selectedId) ??
    mockCategories[0];

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-muted">
      <header className="flex shrink-0 items-center bg-background px-5 pt-[max(env(safe-area-inset-top),16px)] pb-2">
        <span className="text-lg font-bold text-foreground">
          시나리오 리스트 확인
        </span>
      </header>

      <CategoryBar
        categories={mockCategories}
        selectedId={selected.categoryId}
        onSelect={(category) => setSelectedId(category.categoryId)}
      />
      <ScenarioList
        key={selected.categoryId}
        scenarios={selected.scenarios}
        onStart={() => {}}
      />
    </main>
  );
}
