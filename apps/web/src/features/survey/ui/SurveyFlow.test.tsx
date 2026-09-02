// SurveyFlow — 문항 종류별 진행 조건, 기타·조건 문항, 제출 결과에 따른 화면 분기
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OTHER_LABEL, QUESTIONS, type Question } from '../model/questions';
import { SurveyFlow } from './SurveyFlow';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));
// 연출은 순수 DOM으로 치환한다 — 대역이 하는 일은 shared/motion/test-double 참고
vi.mock('motion/react', () => import('@/shared/motion/test-double'));
// 화면은 member만 읽고, api 클라이언트는 getState로 토큰을 읽는다
vi.mock('@/shared/auth/auth-store', () => {
  const state = {
    member: { userId: 7, email: 'a@b.c' },
    accessToken: 'token',
    refreshToken: 'refresh',
  };
  return {
    useAuthStore: Object.assign(
      (selector: (value: unknown) => unknown) => selector(state),
      { getState: () => state },
    ),
  };
});

const fetchMock = vi.fn();
// 서버 라우트는 백엔드와 같은 봉투로 답한다
const routeReply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

// 제목의 줄바꿈은 화면에선 그대로지만 매처는 공백 하나로 봐야 찾는다
const titleOf = (question: Question) => question.title.replace('\n', ' ');
const byId = (id: string) => QUESTIONS.find((question) => question.id === id)!;

// 마지막 선택지를 쓴다 — 첫 선택지는 '유학 준비'처럼 조건 문항을 끌어들일 수 있다
const optionOf = (question: Question) => {
  if (question.kind !== 'single' && question.kind !== 'multi') {
    throw new Error('선택지가 없는 문항이다');
  }
  return question.options[question.options.length - 1];
};

// 지금 보이는 문항에 가장 단순하게 답하고 넘어간다
const answerCurrent = async (question: Question) => {
  await screen.findByText(titleOf(question));
  if (question.kind === 'single') {
    await userEvent.click(
      screen.getByRole('button', { name: optionOf(question) }),
    );
  } else if (question.kind === 'multi') {
    await userEvent.click(
      screen.getByRole('button', { name: optionOf(question) }),
    );
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
  } else if (question.kind === 'scale') {
    await userEvent.click(screen.getByRole('button', { name: '3점' }));
  } else {
    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
  }
};

// 첫 문항부터 마지막 문항 직전까지. 조건 문항(유학 준비)은 안 뜨게 답한다
const answerUntilLast = async () => {
  await userEvent.click(screen.getByRole('button', { name: '시작하기' }));
  const shown = QUESTIONS.filter((question) => !question.showIf);
  for (const question of shown.slice(0, -1)) await answerCurrent(question);
  await screen.findByText(titleOf(shown[shown.length - 1]));
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('SurveyFlow', () => {
  it('단일 선택은 고르는 즉시 다음 문항으로 넘어간다', async () => {
    render(<SurveyFlow />);
    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    await userEvent.click(
      screen.getByRole('button', { name: optionOf(QUESTIONS[0]) }),
    );

    expect(await screen.findByText(titleOf(QUESTIONS[1]))).toBeTruthy();
  });

  it('기타를 고르면 바로 넘어가지 않고 쓸 칸과 다음 버튼이 열린다', async () => {
    render(<SurveyFlow />);
    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    await userEvent.click(screen.getByRole('button', { name: OTHER_LABEL }));

    expect(screen.getByText(titleOf(QUESTIONS[0]))).toBeTruthy();
    expect(screen.getByRole('textbox', { name: '기타 내용' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '다음' })).toBeTruthy();
  });

  it('유학 준비를 고르면 준비 방법 문항이 끼어든다', async () => {
    render(<SurveyFlow />);
    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));
    await answerCurrent(byId('channel'));
    await screen.findByText(titleOf(byId('study_purpose')));

    await userEvent.click(screen.getByRole('button', { name: '유학 준비' }));

    expect(
      await screen.findByText(titleOf(byId('study_abroad_prep'))),
    ).toBeTruthy();
  });

  it('복수 선택은 하나도 안 고르면 다음으로 못 넘어간다', async () => {
    render(<SurveyFlow />);
    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));
    await answerCurrent(byId('channel'));
    await answerCurrent(byId('study_purpose'));
    const features = byId('features');
    await screen.findByText(titleOf(features));

    const next = screen.getByRole('button', { name: '다음' });
    expect(next).toHaveProperty('disabled', true);

    await userEvent.click(
      screen.getByRole('button', { name: optionOf(features) }),
    );
    expect(next).toHaveProperty('disabled', false);
  });

  it('마지막 주관식을 비운 채 제출하면 그 답 없이 서버 라우트로 보내고 완료 화면을 보여준다', async () => {
    fetchMock.mockResolvedValue(
      routeReply(200, { success: true, data: { result: 'saved' } }),
    );
    render(<SurveyFlow />);
    await answerUntilLast();

    await userEvent.click(
      screen.getByRole('button', { name: '건너뛰고 제출하기' }),
    );

    expect(await screen.findByText('소중한 의견 고마워요!')).toBeTruthy();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/survey');
    expect(init.headers.get('Authorization')).toBe('Bearer token');
    const body = JSON.parse(init.body);
    expect(body.email).toBe('a@b.c');
    expect(body.answers.satisfaction).toBe(3);
    expect(body.answers).not.toHaveProperty('wish');
    expect(localStorage.getItem('survey-done')).not.toBeNull();
  });

  it('이미 참여한 유저면(duplicate) 그대로 완료 화면을 보여준다', async () => {
    fetchMock.mockResolvedValue(
      routeReply(200, { success: true, data: { result: 'duplicate' } }),
    );
    render(<SurveyFlow />);
    await answerUntilLast();

    await userEvent.click(
      screen.getByRole('button', { name: '건너뛰고 제출하기' }),
    );

    expect(await screen.findByText('소중한 의견 고마워요!')).toBeTruthy();
  });

  it('저장에 실패하면 문항에 머문다', async () => {
    fetchMock.mockResolvedValue(
      routeReply(502, { success: false, error: { message: '실패' } }),
    );
    render(<SurveyFlow />);
    await answerUntilLast();

    await userEvent.click(
      screen.getByRole('button', { name: '건너뛰고 제출하기' }),
    );

    expect(screen.queryByText('소중한 의견 고마워요!')).toBeNull();
    expect(
      await screen.findByRole('button', { name: '건너뛰고 제출하기' }),
    ).toBeTruthy();
  });

  it('이 기기에서 이미 마쳤으면 문항 없이 완료 화면을 보여준다', () => {
    localStorage.setItem('survey-done', '1');

    render(<SurveyFlow />);

    expect(screen.getByText('소중한 의견 고마워요!')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '시작하기' })).toBeNull();
  });
});
