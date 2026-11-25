// 대화 칸 스크롤 판정 테스트
import { describe, expect, it } from 'vitest';

import {
  isAtLatest,
  isFollowingLatest,
  scrollTopForLatest,
  scrollTopToFollow,
} from './chat-scroll';

describe('isAtLatest', () => {
  it('맨 아래에서 몇 px 안쪽이면 최신 대화를 보는 중으로 본다', () => {
    expect(
      isAtLatest({ scrollTop: 396, clientHeight: 300, scrollHeight: 700 }),
    ).toBe(true);
  });

  it('위로 끌어 올려 지난 대화를 보는 중이면 아니다', () => {
    expect(
      isAtLatest({ scrollTop: 200, clientHeight: 300, scrollHeight: 700 }),
    ).toBe(false);
  });
});

describe('isFollowingLatest', () => {
  it('긴 새 말풍선의 첫 줄에 맞춰 둔 자리면 맨 아래가 아니어도 최신을 따라가는 중이다', () => {
    expect(
      isFollowingLatest({
        scrollTop: 464,
        clientHeight: 300,
        scrollHeight: 1000,
        latestTop: 500,
        latestBottom: 988,
        fadePx: 36,
      }),
    ).toBe(true);
  });

  it('최신 말 아래끝까지 보이게 내려와 있으면 바닥 여백이 남아도 따라가는 중이다 — 점 말풍선을 따라 내린 자리', () => {
    expect(
      isFollowingLatest({
        scrollTop: 206,
        clientHeight: 263,
        scrollHeight: 481,
        latestTop: 300,
        latestBottom: 469,
        fadePx: 36,
      }),
    ).toBe(true);
  });

  it('새 말풍선 위끝보다 위로 올려 지난 대화를 보는 중이면 따라가지 않는다', () => {
    expect(
      isFollowingLatest({
        scrollTop: 300,
        clientHeight: 300,
        scrollHeight: 1000,
        latestTop: 500,
        latestBottom: 988,
        fadePx: 36,
      }),
    ).toBe(false);
  });
});

describe('scrollTopForLatest', () => {
  it('새 말풍선이 칸에 다 들어가면 맨 아래로 내린다', () => {
    const top = scrollTopForLatest({
      clientHeight: 300,
      scrollHeight: 900,
      latestTop: 700,
      fadePx: 36,
    });

    expect(top).toBe(600);
  });

  it('새 말풍선이 칸보다 길면 첫 줄이 흐림 띠 바로 아래에 오게 맞춘다', () => {
    const top = scrollTopForLatest({
      clientHeight: 300,
      scrollHeight: 1000,
      latestTop: 500,
      fadePx: 36,
    });

    expect(top).toBe(464);
  });
});

describe('scrollTopToFollow', () => {
  it('말하는 줄이 칸 아래로 넘어가면 넘친 만큼 내린다', () => {
    const top = scrollTopToFollow({
      scrollTop: 100,
      clientHeight: 300,
      targetTop: 410,
      targetBottom: 430,
      fadePx: 36,
    });

    expect(top).toBe(130);
  });

  it('말하는 줄이 칸 안에 보이면 그대로 둔다', () => {
    const top = scrollTopToFollow({
      scrollTop: 100,
      clientHeight: 300,
      targetTop: 330,
      targetBottom: 350,
      fadePx: 36,
    });

    expect(top).toBe(100);
  });

  it('펼친 해석이 칸보다 길면 끝이 아니라 첫 줄이 흐림 띠 바로 아래에 오게 멈춘다', () => {
    const top = scrollTopToFollow({
      scrollTop: 100,
      clientHeight: 300,
      targetTop: 380,
      targetBottom: 800,
      fadePx: 36,
    });

    expect(top).toBe(344);
  });
});
