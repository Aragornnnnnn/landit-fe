// 시나리오를 만드는 동안의 안드로이드 뒤로가기 — 만드는 중엔 나가고, 다 만든 뒤엔 머무는지 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoleplayDraft } from '@/features/roleplay/model/roleplay-draft';
import { runBackPress } from '@/shared/bridge/back-press';

import { ScenarioMaker } from './ScenarioMaker';

vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/features/conversation/ui/character/PartnerCharacter', () => ({
  PartnerCharacter: () => null,
}));

afterEach(() => cleanup());

const draft = {
  myRole: '손님',
  partnerRole: '점원',
  situation: '주문',
} as RoleplayDraft;

const renderMaker = (title: string | null) => {
  const onLeave = vi.fn();
  render(
    <ScenarioMaker
      partner="teddy"
      partnerName="테디"
      draft={draft}
      title={title}
      slow={false}
      onLeave={onLeave}
    />,
  );
  return onLeave;
};

describe('ScenarioMaker 뒤로가기', () => {
  it('만드는 중에 뒤로가기를 누르면 돌아가기와 같이 나간다', () => {
    const onLeave = renderMaker(null);

    runBackPress();

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('다 만들어 넘어가는 중엔 뒤로가기를 삼키고 머문다', () => {
    const onLeave = renderMaker('카페 주문');

    const handled = runBackPress();

    expect(handled).toBe(true);
    expect(onLeave).not.toHaveBeenCalled();
  });
});
