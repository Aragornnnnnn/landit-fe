// ScenarioIntroStep — 온보딩 마지막 스텝. 첫 시나리오를 보여주고, 못 받아도 시작은 막지 않는 계약 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DailyScenario } from '@/features/scenario/api/daily';

import { ScenarioIntroStep } from './ScenarioIntroStep';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
// next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (AccentStep 테스트와 같은 이유)
vi.mock('next/image', () => ({ default: () => <span /> }));

afterEach(cleanup);

const scenario = {
  scenarioTitle: '입주 첫날, 룸메이트 Marco와 첫 만남',
  briefing:
    '기숙사 입주 첫날, 방문을 열자 룸메이트 Marco가 반갑게 인사를 건넨다.',
  thumbnailUrl: 'https://cdn.example/thumb.webp',
  openingPreview: { character: { characterId: 'marco', ttsVoice: null } },
} as DailyScenario;

describe('ScenarioIntroStep', () => {
  it('첫 시나리오의 제목과 상황을 보여주고, 버튼이 상대 이름으로 대화를 시작한다', () => {
    const onStart = vi.fn();

    render(
      <ScenarioIntroStep
        scenario={scenario}
        loading={false}
        onStart={onStart}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Marco와 대화 시작할게요!' }),
    );

    expect(screen.getByText(scenario.scenarioTitle)).toBeInTheDocument();
    expect(screen.getByText(scenario.briefing)).toBeInTheDocument();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('썸네일을 못 불러오면 그림 자리를 비워 두고 제목과 상황은 그대로 보여준다', () => {
    render(
      <ScenarioIntroStep
        scenario={scenario}
        loading={false}
        onStart={vi.fn()}
      />,
    );
    fireEvent.error(screen.getByRole('presentation'));

    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    expect(screen.getByText(scenario.scenarioTitle)).toBeInTheDocument();
  });

  it('시나리오를 못 받았어도 카드 없이 첫 대화를 시작할 수 있다', () => {
    const onStart = vi.fn();

    render(
      <ScenarioIntroStep scenario={null} loading={false} onStart={onStart} />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: '첫 대화 시작할게요!' }),
    );

    expect(screen.queryByText(scenario.scenarioTitle)).not.toBeInTheDocument();
    expect(onStart).toHaveBeenCalledOnce();
  });
});
