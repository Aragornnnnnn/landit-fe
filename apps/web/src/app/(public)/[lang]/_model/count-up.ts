// 숫자 올라가는 연출의 한 장면 — "29K+"·"4.8" 같은 표기를 숫자와 꼬리로 나눠, 진행도만큼 키운 값을 같은 표기로 돌려준다

const NUMBER_HEAD = /^(\d+(?:\.(\d+))?)(.*)$/;

/** 처음엔 빠르게 오르다 끝에서 천천히 멈춘다 */
const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

/**
 * @param value 다 올라간 뒤의 표기 (예: `29K+`, `4.8`). 숫자로 시작하지 않으면 그대로 돌려준다
 * @param progress 0(시작)~1(끝)
 */
export const countUpFrame = (value: string, progress: number) => {
  const match = NUMBER_HEAD.exec(value);
  if (!match) return value;
  if (progress >= 1) return value;
  const [, number, decimals = '', tail] = match;
  const current = Number(number) * easeOut(Math.max(0, progress));
  const shown =
    decimals.length > 0
      ? current.toFixed(decimals.length)
      : String(Math.floor(current));
  return `${shown}${tail}`;
};
