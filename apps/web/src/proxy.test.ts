// 랜딩 주소 언어 처리 검증 — 루트는 언어 주소로 보내고, 언어 주소엔 언어 헤더를 붙인다
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { PATH_LOCALE_HEADER } from '@/shared/i18n/locale';

import { proxy } from './proxy';

const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(new URL(path, 'https://www.landit.im'), { headers });

describe('proxy', () => {
  it('루트는 기기 언어의 랜딩으로 잠시 보낸다(307)', () => {
    // Given 일본어 기기
    const response = proxy(
      request('/', { 'accept-language': 'ja-JP,ja;q=0.9' }),
    );

    // Then /ja로 보낸다
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://www.landit.im/ja');
  });

  it('저장 언어 쿠키가 기기 언어보다 먼저다', () => {
    const response = proxy(
      request('/', { 'accept-language': 'ja-JP', cookie: 'landit-locale=ko' }),
    );

    expect(response.headers.get('location')).toBe('https://www.landit.im/ko');
  });

  it('언어 정보가 없으면(검색 봇 등) 한국어 랜딩으로 보낸다', () => {
    expect(proxy(request('/')).headers.get('location')).toBe(
      'https://www.landit.im/ko',
    );
  });

  it('보낼 때 유입 딱지(쿼리)를 그대로 넘긴다', () => {
    const response = proxy(
      request('/?utm_source=instagram&utm_medium=bio', {
        'accept-language': 'ko-KR',
      }),
    );

    expect(response.headers.get('location')).toBe(
      'https://www.landit.im/ko?utm_source=instagram&utm_medium=bio',
    );
  });

  it('언어 주소는 그대로 보여 주고, 서버 렌더가 읽을 언어 헤더를 붙인다', () => {
    // Given 한국어 쿠키가 있어도 /ja를 열면
    const response = proxy(
      request('/ja/updates', { cookie: 'landit-locale=ko' }),
    );

    // Then 이동 없이 일본어 헤더를 단다
    expect(response.headers.get('location')).toBeNull();
    expect(
      response.headers.get(`x-middleware-request-${PATH_LOCALE_HEADER}`),
    ).toBe('ja');
  });
});
