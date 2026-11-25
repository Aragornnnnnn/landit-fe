// 전신 무대 프레임 — 캐릭터마다 다른 그림을 얼굴 크기·턱 높이가 같은 한 틀에 맞춰, 무대가 캐릭터별 예외 없이 그리게 한다

/** 원본 그림 좌표의 얼굴 기준점. 눈 두 개 중심 높이, 턱 끝(테디는 주둥이 아래 끝), 얼굴 가운데 */
export interface FaceLandmarks {
  eyeY: number;
  chinY: number;
  centerX: number;
}

/**
 * 프레임 단위. 눈→턱 거리를 face(100)로 두고 나머지를 그 배수로 잡는다.
 * chinY 300 — 턱 위로 얼굴 3개 자리. 머리가 가장 높은 마르코(머리 끝이 턱 위 2.85)도 들어간다.
 * height 1300 — 다리가 가장 긴 클로이(발끝이 턱 아래 9.7)까지 담는다. 무대는 화면 아래로 넘치는 부분을 자른다.
 * width 460 — 가장 넓은 테디(얼굴 가운데 기준 좌우 2.14씩)까지 담는다.
 */
export const STAGE_FRAME = {
  face: 100,
  chinY: 300,
  width: 460,
  height: 1300,
} as const;

/** 얼굴 기준점을 프레임에 맞춘 원본 좌표 viewBox. 세 캐릭터가 같은 비율의 상자에 같은 자리로 그려진다 */
export const toStageViewBox = ({ eyeY, chinY, centerX }: FaceLandmarks) => {
  const unit = (chinY - eyeY) / STAGE_FRAME.face;
  const left = centerX - (STAGE_FRAME.width / 2) * unit;
  const top = chinY - STAGE_FRAME.chinY * unit;
  return [left, top, STAGE_FRAME.width * unit, STAGE_FRAME.height * unit]
    .map((value) => Number(value.toFixed(2)))
    .join(' ');
};
