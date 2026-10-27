// 셸 문구 묶음 — 일본어가 한국어와 같은 키를 모두 갖고, 비어 있지 않은지 검증한다
import { SHELL_MESSAGES } from './shell-messages';

const keysOf = (value: object): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === 'object' && !Array.isArray(child)
      ? keysOf(child).map((sub) => `${key}.${sub}`)
      : [key],
  );

describe('SHELL_MESSAGES', () => {
  it('일본어가 한국어의 키를 빠짐없이 갖는다', () => {
    expect(keysOf(SHELL_MESSAGES.ja).sort()).toEqual(
      keysOf(SHELL_MESSAGES.ko).sort(),
    );
  });

  it('요일 이름은 일요일부터 7개다', () => {
    expect(SHELL_MESSAGES.ko.weekdays).toHaveLength(7);
    expect(SHELL_MESSAGES.ja.weekdays).toEqual([
      '日',
      '月',
      '火',
      '水',
      '木',
      '金',
      '土',
    ]);
  });
});
