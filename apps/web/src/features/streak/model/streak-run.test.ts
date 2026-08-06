// 이번 스트릭 줄(칸 일곱 개)의 계약 테스트
import { describe, expect, it } from 'vitest';

import { streakRunOf } from './streak-run';

// 읽기 좋게 — 채운 칸은 요일, 빈 칸은 점
const shapeOf = (cells: ReturnType<typeof streakRunOf>) =>
  cells.map((cell) => (cell.filled ? cell.label : '·')).join('');

const latestOf = (cells: ReturnType<typeof streakRunOf>) =>
  cells.find((cell) => cell.latest) ?? null;

describe('streakRunOf', () => {
  it('첫 날이면 첫 칸만 채우고 나머지 여섯 칸은 활주로로 남긴다', () => {
    // given — 오늘(목) 처음 채웠다
    const cells = streakRunOf({
      currentStreakDays: 1,
      activeToday: true,
      today: '2026-08-06',
    });

    // then — 목요일 한 칸만 차고, 뒤로 엿새가 비어 있다
    expect(shapeOf(cells)).toBe('목······');
    expect(cells.map((cell) => cell.label).join('')).toBe('목금토일월화수');
  });

  it('이레 안이면 왼쪽부터 채우고 오늘이 그 마지막 칸이 된다', () => {
    // given — 오늘(목)까지 사흘째
    const cells = streakRunOf({
      currentStreakDays: 3,
      activeToday: true,
      today: '2026-08-06',
    });

    // then — 화·수·목이 차고 오늘은 세 번째 칸
    expect(shapeOf(cells)).toBe('화수목····');
    expect(latestOf(cells)?.date).toBe('2026-08-06');
  });

  it('이레를 채우면 일곱 칸이 꽉 찬다', () => {
    const cells = streakRunOf({
      currentStreakDays: 7,
      activeToday: true,
      today: '2026-08-06',
    });

    expect(shapeOf(cells)).toBe('금토일월화수목');
  });

  it('여드레째부터는 오늘을 다섯 번째에 고정하고 뒤 두 칸을 남긴다', () => {
    // given — 오늘(목)까지 열이틀째. 줄은 일수가 아니라 흐름을 말한다
    const cells = streakRunOf({
      currentStreakDays: 12,
      activeToday: true,
      today: '2026-08-06',
    });

    // then — 앞 네 칸이 차고 오늘이 다섯 번째, 뒤 두 칸이 활주로
    expect(shapeOf(cells)).toBe('일월화수목··');
    expect(cells.indexOf(latestOf(cells)!)).toBe(4);
  });

  it('오늘이 아직이면 줄이 어제에 붙는다', () => {
    // given — 자정을 넘겨 조회가 도착한 경우. 서버가 말하는 오늘(금)은 아직 비었다
    const cells = streakRunOf({
      currentStreakDays: 3,
      activeToday: false,
      today: '2026-08-07',
    });

    // then — 마지막으로 채운 날은 어제(목)이고, 그 뒤로 활주로가 이어진다
    expect(shapeOf(cells)).toBe('화수목····');
    expect(latestOf(cells)?.date).toBe('2026-08-06');
  });

  it('0일이면 채운 칸도 도장을 찍을 칸도 없다', () => {
    // given — 서버가 아직 이번 완료를 반영하지 못한 경우
    const cells = streakRunOf({
      currentStreakDays: 0,
      activeToday: false,
      today: '2026-08-06',
    });

    // then — 오늘부터 이레가 통째로 활주로다
    expect(shapeOf(cells)).toBe('·······');
    expect(latestOf(cells)).toBeNull();
    expect(cells[0].date).toBe('2026-08-06');
  });
});
