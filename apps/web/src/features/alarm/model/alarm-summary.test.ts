// 알람 한 줄 요약 — 내 정보 알람 행 오른쪽에 무엇을 보여 줄지
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import ja from '@/shared/i18n/locales/ja';
import ko from '@/shared/i18n/locales/ko';

import { alarmSummary } from './alarm-summary';

const t = createTranslator({ locale: 'ko', messages: ko, namespace: 'alarm' });
const tJa = createTranslator({
  locale: 'ja',
  messages: ja,
  namespace: 'alarm',
});

describe('alarmSummary', () => {
  it('등록 전이면 "없음"이다', () => {
    expect(
      alarmSummary(
        { registered: false, blocked: true, time: '19:00' },
        t,
        'ko',
      ),
    ).toEqual({ text: '없음', alert: false });
  });

  it('등록했는데 권한이 막혀 안 울리면 시각 대신 "권한 필요"로 경고한다', () => {
    expect(
      alarmSummary({ registered: true, blocked: true, time: '19:00' }, t, 'ko'),
    ).toEqual({ text: '권한 필요', alert: true });
  });

  it('등록했고 울릴 수 있으면 매일 울리는 시각이다', () => {
    expect(
      alarmSummary(
        { registered: true, blocked: false, time: '07:30' },
        t,
        'ko',
      ),
    ).toEqual({ text: '매일 오전 7시 30분', alert: false });
  });

  it('일본어 화면에서는 시각까지 일본어로 쓴다', () => {
    expect(
      alarmSummary(
        { registered: true, blocked: false, time: '07:30' },
        tJa,
        'ja',
      ),
    ).toEqual({ text: '毎日午前7時30分', alert: false });
  });
});
