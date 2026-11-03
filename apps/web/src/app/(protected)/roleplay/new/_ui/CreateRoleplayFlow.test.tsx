// 시나리오 만들기 — 상대 고르기 → 세 칸 적기 → 생성. 단계 이동, 시작 조건, 아이디어 채우기, 생성 실패 복귀
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  RoleplayIdeaResponse,
  RoleplaySettings,
} from '@/features/roleplay/api/roleplay';
import { useCreateRoleplayScenarioMutation } from '@/features/roleplay/model/useCreateRoleplayScenarioMutation';
import { useRoleplayIdeaMutation } from '@/features/roleplay/model/useRoleplayIdeaMutation';
import { ApiError } from '@/shared/api/api-error';

import { CreateRoleplayFlow } from './CreateRoleplayFlow';

// 주소는 경계다 — 이동하면 다음 렌더가 읽을 쿼리만 바꾼다
let search = new URLSearchParams();
const moveTo = (href: string) => {
  search = new URLSearchParams(href.split('?')[1] ?? '');
};
const replace = vi.fn(moveTo);
const push = vi.fn(moveTo);
const back = vi.fn(() => {
  search = new URLSearchParams();
});
const track = vi.hoisted(() => vi.fn());
vi.mock('@/shared/analytics', () => ({ track }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, back }),
  useSearchParams: () => search,
}));
// 구독은 경계다 — 기본은 열려 있고, 잠긴 사용자는 페이월로 간다
const gate = vi.hoisted(() => ({
  locked: false,
  freeTrialAvailable: false,
}));
vi.mock('@/features/roleplay/model/useRoleplayGate', () => ({
  useRoleplayGate: () => ({
    locked: gate.locked && !gate.freeTrialAvailable,
    deciding: false,
    guard: (go: () => void) =>
      gate.locked && !gate.freeTrialAvailable ? push('/paywall') : go(),
  }),
}));
vi.mock('@/features/roleplay/model/useRoleplayIdeaMutation', () => ({
  useRoleplayIdeaMutation: vi.fn(),
}));
vi.mock('@/features/roleplay/model/useCreateRoleplayScenarioMutation', () => ({
  useCreateRoleplayScenarioMutation: vi.fn(),
}));
const prepareSession = vi.hoisted(() => vi.fn());
vi.mock('@/features/roleplay/model/useRoleplaySessionHandoff', () => ({
  useRoleplaySessionHandoff: () => ({ prepare: prepareSession }),
}));

type Callbacks<T> = {
  onSuccess?: (value: T) => void;
  onError?: (cause: unknown) => void;
};

const IDEA = {
  id: 4,
  title: '호텔 방 바꾸기',
  userRole: '여행객',
  aiRole: '호텔 직원',
  situation: '방 바꿔 달라고 하기',
};

// 뮤테이션은 경계다 — 부르면 바로 성공·실패 콜백을 돌려준다
const answerIdea = (response: RoleplayIdeaResponse = { idea: IDEA }) => {
  const mutate = vi.fn(
    (_excludeId: unknown, callbacks: Callbacks<RoleplayIdeaResponse>) =>
      callbacks.onSuccess?.(response),
  );
  vi.mocked(useRoleplayIdeaMutation).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useRoleplayIdeaMutation>);
  return mutate;
};

const answerCreate = (
  result: 'success' | 'error' | 'pending',
  error: unknown = new Error('실패'),
) => {
  const mutateAsync = vi.fn(() => {
    if (result === 'success') {
      return Promise.resolve({
        id: 9,
        title: '카페에서 주문하기',
      } as RoleplaySettings);
    }
    if (result === 'error') return Promise.reject(error);
    return new Promise<RoleplaySettings>(() => {});
  });
  vi.mocked(useCreateRoleplayScenarioMutation).mockReturnValue({
    mutateAsync,
  } as unknown as ReturnType<typeof useCreateRoleplayScenarioMutation>);
  return mutateAsync;
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
  gate.locked = false;
  gate.freeTrialAvailable = false;
  sessionStorage.clear();
  // 히스토리가 있어 뒤로가기가 back으로 간다
  window.history.pushState(null, '', '/roleplay/new');
  answerIdea();
  answerCreate('pending');
  prepareSession.mockReset();
  prepareSession.mockResolvedValue(undefined);
  replace.mockClear();
  push.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CreateRoleplayFlow', () => {
  it('첫 상대에서 이전으로 넘기면 마지막 상대로 간다 — 끝이 없다', async () => {
    const { rerender } = render(<CreateRoleplayFlow />);

    await userEvent.click(screen.getByRole('button', { name: '이전 상대' }));
    await clickAndRerender('계속하기', rerender);

    expect(screen.getByLabelText('테디의 역할')).toBeInTheDocument();
  });

  it('마지막 상대에서 다음으로 넘기면 첫 상대로 돌아온다', async () => {
    const { rerender } = render(<CreateRoleplayFlow />);
    const next = screen.getByRole('button', { name: '다음 상대' });

    await userEvent.click(next);
    await userEvent.click(next);
    await userEvent.click(next);
    await clickAndRerender('계속하기', rerender);

    expect(screen.getByLabelText('클로이의 역할')).toBeInTheDocument();
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

  it('서버 제한보다 길게 적을 수 없다 — 역할 200자, 상황 2000자', async () => {
    await goToForm();

    expect(screen.getByLabelText('나의 역할')).toHaveAttribute(
      'maxlength',
      '200',
    );
    expect(screen.getByLabelText('클로이의 역할')).toHaveAttribute(
      'maxlength',
      '200',
    );
    expect(screen.getByLabelText('상황과 주제')).toHaveAttribute(
      'maxlength',
      '2000',
    );
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

  it('아이디어를 다시 받으면 직전에 받은 것은 빼 달라고 한다', async () => {
    const mutate = answerIdea();
    await goToForm();
    const ideaButton = screen.getByRole('button', {
      name: '아이디어 추천받기',
    });

    await userEvent.click(ideaButton);
    await userEvent.click(ideaButton);

    expect(mutate.mock.calls.map(([excludeId]) => excludeId)).toEqual([
      undefined,
      IDEA.id,
    ]);
  });

  it('고를 아이디어가 없으면 칸을 건드리지 않는다', async () => {
    answerIdea({ idea: null });
    await goToForm();
    await userEvent.type(screen.getByLabelText('나의 역할'), '손님');

    await userEvent.click(
      screen.getByRole('button', { name: '아이디어 추천받기' }),
    );

    expect(screen.getByLabelText('나의 역할')).toHaveValue('손님');
  });

  it('시작하면 앞뒤 공백을 걷어 만들기를 요청하고 카드 섞기 화면을 띄운다', async () => {
    const mutate = answerCreate('pending');
    await goToForm();
    await fillAll();
    await userEvent.type(screen.getByLabelText('나의 역할'), '  ');

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(mutate).toHaveBeenCalledWith({
      characterId: 'chloe',
      userRole: '손님',
      aiRole: '바리스타',
      situation: '주문하기',
    });
    expect(screen.getByText('맞춤 대화를 만들고 있어요')).toBeInTheDocument();
  });

  it('첫 발화까지 준비되면 제목과 완성 문구를 보여 주고 대화로 넘어간다', async () => {
    answerCreate('success');
    await goToForm();
    await fillAll();

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(prepareSession).toHaveBeenCalledWith(9, expect.any(Function));
    expect(await screen.findByText('카페에서 주문하기')).toBeInTheDocument();
    expect(screen.getByText('다 됐어요!')).toBeInTheDocument();
    await waitFor(
      () => expect(replace).toHaveBeenCalledWith('/conversation/roleplay/9'),
      { timeout: 1_500 },
    );
  });

  it('첫 발화가 끝나기 전엔 완성했다고 하지 않는다', async () => {
    answerCreate('success');
    prepareSession.mockReturnValue(new Promise(() => {}));
    await goToForm();
    await fillAll();

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(screen.getByText('맞춤 대화를 만들고 있어요')).toBeInTheDocument();
    expect(screen.queryByText('다 됐어요!')).not.toBeInTheDocument();
  });

  it('세션을 못 열면 완성했다고 하지 않고 대화 화면으로 넘긴다 — 거기서 다시 열어 본다', async () => {
    answerCreate('success');
    prepareSession.mockRejectedValue(new Error('실패'));
    await goToForm();
    await fillAll();

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/conversation/roleplay/9'),
    );
    expect(screen.queryByText('다 됐어요!')).not.toBeInTheDocument();
  });

  it('응답이 너무 오래 없으면 돌아갈 길을 보여 준다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    answerCreate('pending');
    await goToForm();
    await fillAll();
    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));
    expect(screen.queryByRole('button', { name: '돌아가기' })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    await userEvent.click(screen.getByRole('button', { name: '돌아가기' }));

    expect(back).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('Roleplay Create Abandoned', {
      partner: 'chloe',
    });
  });

  it('프리미엄이 없다고 거절되면 페이월로 보낸다', async () => {
    answerCreate(
      'error',
      new ApiError('막힘', 403, '/api/v1/roleplays', 'PREMIUM_REQUIRED'),
    );
    await goToForm();
    await fillAll();

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(expect.stringContaining('/paywall')),
    );
    expect(track).toHaveBeenCalledWith('Roleplay Create Failed', {
      partner: 'chloe',
      reason: 'premium_required',
    });
  });

  describe('무료 사용자', () => {
    // 페이월은 입력 주소(상대가 붙은)로 돌려보낸다
    const returnFromPaywall = () => {
      cleanup();
      search = new URLSearchParams('partner=chloe');
      render(<CreateRoleplayFlow />);
    };

    beforeEach(() => {
      gate.locked = true;
    });

    it('무료 한 번을 쓰기 전이면 아이디어를 받고 시나리오를 만들 수 있다', async () => {
      gate.freeTrialAvailable = true;
      const createScenario = answerCreate('pending');
      await goToForm();

      await userEvent.click(
        screen.getByRole('button', { name: '아이디어 추천받기' }),
      );
      await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

      expect(push).not.toHaveBeenCalled();
      expect(createScenario).toHaveBeenCalled();
    });

    it('무료 한 번을 쓴 뒤엔 아이디어를 누르면 받지 않고 페이월로 간다', async () => {
      const requestIdea = answerIdea();
      await goToForm();

      await userEvent.click(
        screen.getByRole('button', { name: '아이디어 추천받기' }),
      );

      expect(push).toHaveBeenCalledWith('/paywall');
      expect(requestIdea).not.toHaveBeenCalled();
    });

    it('무료 한 번을 쓴 뒤엔 시작하기를 누르면 만들지 않고 페이월로 간다', async () => {
      const createScenario = answerCreate('pending');
      await goToForm();
      await fillAll();

      await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

      expect(push).toHaveBeenCalledWith('/paywall');
      expect(createScenario).not.toHaveBeenCalled();
    });

    it('페이월에 갔다 돌아오면 적던 글이 남아 있다', async () => {
      await goToForm();
      await fillAll();
      await userEvent.click(screen.getByRole('button', { name: '시작하기' }));
      returnFromPaywall();

      expect(screen.getByLabelText('나의 역할')).toHaveValue('손님');
      expect(screen.getByLabelText('상황과 주제')).toHaveValue('주문하기');
    });

    it('서버가 프리미엄을 요구해 페이월에 가도 적던 글이 남아 있다', async () => {
      gate.freeTrialAvailable = true;
      answerCreate(
        'error',
        new ApiError('막힘', 403, '/api/v1/roleplays', 'PREMIUM_REQUIRED'),
      );
      await goToForm();
      await fillAll();
      await userEvent.click(screen.getByRole('button', { name: '시작하기' }));
      await waitFor(() => expect(push).toHaveBeenCalled());
      returnFromPaywall();

      expect(screen.getByLabelText('나의 역할')).toHaveValue('손님');
    });

    it('돌아와서 한 번 복원한 글은 다음에 새로 열 땐 남지 않는다', async () => {
      await goToForm();
      await fillAll();
      await userEvent.click(screen.getByRole('button', { name: '시작하기' }));
      returnFromPaywall();

      returnFromPaywall();

      expect(screen.getByLabelText('나의 역할')).toHaveValue('');
    });
  });

  it('만들기에 실패하면 적은 글을 그대로 둔 채 입력으로 돌아온다', async () => {
    answerCreate('error');
    await goToForm();
    await fillAll();

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(screen.getByLabelText('상황과 주제')).toHaveValue('주문하기');
    expect(track).toHaveBeenCalledWith('Roleplay Create Failed', {
      partner: 'chloe',
      reason: 'error',
    });
  });

  it('상대 고르기에서 입력으로 넘어갈 때 히스토리를 쌓지 않는다 — 만든 뒤 대화에서 셸 뒤로가기가 빈 만들기 화면으로 가지 않게', async () => {
    await goToForm();

    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/roleplay/new?partner=chloe');
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

  it('새로고침한 입력에서 뒤로 가도 주소에 있던 상대가 선택돼 있다', async () => {
    search = new URLSearchParams('partner=teddy');
    const { rerender } = render(<CreateRoleplayFlow />);

    await clickAndRerender('뒤로', rerender);
    await clickAndRerender('계속하기', rerender);

    expect(screen.getByLabelText('테디의 역할')).toBeInTheDocument();
  });
});
