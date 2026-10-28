// 언어별 위젯 아트 — 일본어면 일본어 그림, 일본어 그림이 없는 키는 한국어 그림을 같이 쓰는지 검증한다
import { WIDGET_ART, WIDGET_ART_JA } from './widget-art';
import { widgetArtFor } from './widget-art-locale';

describe('widgetArtFor', () => {
  it('한국어면 지금 그림 그대로다', () => {
    expect(widgetArtFor('ko')).toBe(WIDGET_ART);
  });

  it('일본어면 글자가 든 그림을 일본어 그림으로 바꾼다', () => {
    expect(widgetArtFor('ja')['arrived-small']).toBe(
      WIDGET_ART_JA['arrived-small'],
    );
  });

  it('일본어 그림이 없는 키(열매)는 한국어 그림을 쓴다', () => {
    expect(widgetArtFor('ja').fruit).toBe(WIDGET_ART.fruit);
  });

  it('일본어 그림이 한국어와 같은 키를 모두 갖는다 — 열매만 빠진다', () => {
    const missing = Object.keys(WIDGET_ART).filter(
      (key) => !(key in WIDGET_ART_JA),
    );

    expect(missing).toEqual(['fruit']);
  });

  it('일본어 그림에만 있는 키가 없다 — 파일 이름이 틀리면 안 쓰인다', () => {
    const extra = Object.keys(WIDGET_ART_JA).filter(
      (key) => !(key in WIDGET_ART),
    );

    expect(extra).toEqual([]);
  });
});
