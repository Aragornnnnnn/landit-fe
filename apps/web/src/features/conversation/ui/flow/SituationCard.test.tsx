// SituationCard — 내가 먼저 거는 대화의 상황 카드가 라벨 → 상황 순서로 읽히는지 본다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SituationCard } from './SituationCard';

afterEach(() => cleanup());

describe('SituationCard', () => {
  it('라벨이 붙은 영역 안에 상황을 보인다', () => {
    render(<SituationCard text="복도에서 새 룸메이트와 마주쳤어요." />);

    expect(
      screen.getByRole('region', { name: '내가 먼저 말해보는 상황' }),
    ).toHaveTextContent('복도에서 새 룸메이트와 마주쳤어요.');
  });
});
