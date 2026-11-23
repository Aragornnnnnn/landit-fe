// 전신 무대 프레임이 캐릭터마다 다른 그림을 같은 얼굴 크기·턱 높이로 맞추는지 확인한다
import { describe, expect, it } from 'vitest';

import { STAGE_FRAME, toStageViewBox } from './stage-frame';

/** viewBox 안에서 원본 y좌표가 프레임 위에서 몇 단위 내려와 있는지(프레임 단위)로 바꾼다 */
const toFrameY = (viewBox: string, y: number) => {
  const [, top, , height] = viewBox.split(' ').map(Number);
  return ((y - top) / height) * STAGE_FRAME.height;
};

describe('toStageViewBox', () => {
  // 얼굴이 작은 그림(마르코)과 큰 그림(테디)의 실제 기준점
  it.each([
    ['얼굴이 작은', { eyeY: 292, chinY: 403, centerX: 500 }],
    ['얼굴이 큰', { eyeY: 341, chinY: 537, centerX: 454.5 }],
  ])('%s 그림도 프레임에서는 같은 턱 높이와 얼굴 크기가 된다', (_, face) => {
    const viewBox = toStageViewBox(face);

    const chin = toFrameY(viewBox, face.chinY);
    expect(chin).toBeCloseTo(STAGE_FRAME.chinY);
    expect(chin - toFrameY(viewBox, face.eyeY)).toBeCloseTo(STAGE_FRAME.face);
  });

  it('얼굴 가운데가 프레임 가로 가운데에 온다', () => {
    const face = { eyeY: 257, chinY: 360, centerX: 500.5 };

    const [left, , width] = toStageViewBox(face).split(' ').map(Number);

    expect(left + width / 2).toBeCloseTo(face.centerX);
  });
});
