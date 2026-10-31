// 시나리오 만들기 — 상대 고르기 → 세 칸 적기 → 생성. 단계 이동, 시작 조건, 아이디어 채우기, 생성 실패 복귀
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RoleplayScenario } from '@/features/roleplay/api/roleplay';
import { useCreateRoleplayScenarioMutation } from '@/features/roleplay/model/useCreateRoleplayScenarioMutation';
import { useRoleplayIdeaMutation } from '@/features/roleplay/model/useRoleplayIdeaMutation';

import { CreateRoleplayFlow } from './CreateRoleplayFlow';

// 주소는 경계다 — 이동하면 다음 렌더가 읽을 쿼리만 바꾼다
let search = new URLSearchParams();
const replace = vi.fn();
const push = vi.fn((href: string) => {
  search = new URLSearchParams(href.split('?')[1] ?? '');
});
const back = vi.fn(() => {
  search = new URLSearchParams();
});
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, back }),
  useSearchParams: () => search,
}));
vi.mock('@/features/roleplay/model/useRoleplayIdeaMutation', () => ({
  useRoleplayIdeaMutation: vi.fn(),
}));
vi.mock('@/features/roleplay/model/useCreateRoleplayScenarioMutation', () => ({
  useCreateRoleplayScenarioMutation: vi.fn(),
}));

type Callbacks<T> = { onSuccess?: (value: T) => void; onError?: () => void };

const IDEA = {
  myRole: '여행객',
  partnerRole: '호텔 직원',
  situation: '방 바꿔 달라고 하기',
};

// 뮤테이션은 경계다 — 부르면 바로 성공·실패 콜백을 돌려준다
const answerIdea = () =>
  vi.mocked(useRoleplayIdeaMutation).mockReturnValue({
    mutate: (_: unknown, callbacks: Callbacks<typeof IDEA>) =>
      callbacks.onSuccess?.(IDEA),
    isPending: false,
  } as unknown as ReturnType<typeof useRoleplayIdeaMutation>);

const answerCreate = (result: 'success' | 'error' | 'pending') => {
  const mutate = vi.fn(
    (_body: unknown, callbacks: Callbacks<RoleplayScenario>) => {
      if (result === 'success') {
        callbacks.onSuccess?.({ scenarioId: 9 } as RoleplayScenario);
      }
      if (result === 'error') callbacks.onError?.();
    },
  );
  vi.mocked(useCreateRoleplayScenarioMutation).mockReturnValue({
    mutate,
  } as unknown as ReturnType<typeof useCreateRoleplayScenarioMutation>);
  return mutate;
};

// 이동이 주소만 바꾸므로 다시 그려 다음 단계를 띄운다
const clickAndRerender = async (
  name: string,
  rerender: (ui: React.ReactNode) => void,
) => {
  await userEvent.click(screen.getByRole('button', { name }));
  rerender(<CreateRoleplayFlow />);
};

const goToForm = async () => {
  const { rerender } = render(<CreateRoleplayFlow />);
  await clickAndRerender('계속하기', rerender);
  return rerender;
};

const fillAll = async () => {
  await userEvent.type(screen.getByLabelText('나의 역할'), '손님');
  await userEvent.type(screen.getByLabelText('클로이의 역할'), '바리스타');
  await userEvent.type(screen.getByLabelText('상황과 주제'), '주문하기');
};

beforeEach(() => {
  search = new URLSearchParams();
  // 히스토리가 있어 뒤로가기가 back으로 간다
  window.history.pushState(null, '', '/roleplay/new');
  answerIdea();
  answerCreate('pending');
});

afterEach(cleanup);

describe('CreateRoleplayFlow', () => {
  it('첫 상대에선 이전으로 넘길 수 없다 — 끝에서 멈춘다', () => {
    render(<CreateRoleplayFlow />);

    expect(screen.getByRole('button', { name: '이전 상대' })).toBeDisabled();
  });

  it('넘긴 상대가 곧 선택이라 입력 칸에 그 상대 이름이 붙는다', async () => {
    const { rerender } = render(<CreateRoleplayFlow />);

    await userEvent.click(screen.getByRole('button', { name: '다음 상대' }));
    await clickAndRerender('계속하기', rerender);

    expect(screen.getByLabelText('마르코의 역할')).toBeInTheDocument();
  });

  it('세 칸을 다 채우기 전엔 시작할 수 없다', async () => {
    await goToForm();

    await userEvent.type(screen.getByLabelText('나의 역할'), '손님');

    expect(screen.getByRole('button', { name: '시작하기' })).toBeDisabled();
  });

  it('아이디어를 받으면 세 칸이 한 조합으로 채워져 바로 시작할 수 있다', async () => {
    await goToForm();

    await userEvent.click(
      screen.getByRole('button', { name: '아이디어 추천받기' }),
    );

    expect(screen.getByLabelText('나의 역할')).toHaveValue('여행객');
    expect(screen.getByLabelText('상황과 주제')).toHaveValue(
      '방 바꿔 달라고 하기',
    );
    expect(screen.getByRole('button', { name: '시작하기' })).toBeEnabled();
  });

  it('시작하면 앞뒤 공백을 걷어 만들기를 요청하고 카드 섞기 화면을 띄운다', async () => {
    const mutate = answerCreate('pending');
    await goToForm();
    await fillAll();
    await userEvent.type(screen.getByLabelText('나의 역할'), '  ');

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(mutate).toHaveBeenCalledWith(
      {
        partner: 'chloe',
        myRole: '손님',
        partnerRole: '바리스타',
        situation: '주문하기',
      },
      expect.anything(),
    );
    expect(screen.getByText('시나리오 카드를 섞고 있어요')).toBeInTheDocument();
  });

  it('만들어지면 그 시나리오의 대화로 넘어간다', async () => {
    answerCreate('success');
    await goToForm();
    await fillAll();

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(replace).toHaveBeenCalledWith('/conversation/roleplay/9');
  });

  it('만들기에 실패하면 적은 글을 그대로 둔 채 입력으로 돌아온다', async () => {
    answerCreate('error');
    await goToForm();
    await fillAll();

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(screen.getByLabelText('상황과 주제')).toHaveValue('주문하기');
  });

  it('입력에서 뒤로 가면 상대 고르기로 돌아가고, 다시 들어오면 적던 글이 남아 있다', async () => {
    const rerender = await goToForm();
    await userEvent.type(screen.getByLabelText('나의 역할'), '손님');

    await clickAndRerender('뒤로', rerender);
    expect(screen.getByText('대화 상대 고르기')).toBeInTheDocument();
    await clickAndRerender('계속하기', rerender);

    expect(screen.getByLabelText('나의 역할')).toHaveValue('손님');
  });

  it('주소에 상대가 있으면 바로 그 상대의 입력으로 연다 — 새로고침해도 고른 상대가 남는다', () => {
    search = new URLSearchParams('partner=teddy');

    render(<CreateRoleplayFlow />);

    expect(screen.getByLabelText('테디의 역할')).toBeInTheDocument();
  });
});
