// 시각 휠 — 24시 시각과 휠 세 칸(오전/오후·시·분) 사이를 오가고, 시를 넘길 때 오전/오후가 바뀌는지 정한다
import type { AlarmTime } from '@landit/bridge';

export interface WheelTime {
  meridiem: 0 | 1;
  hour12: number;
  minute: number;
}

export const toWheel = ({ hour, minute }: AlarmTime): WheelTime => ({
  meridiem: hour < 12 ? 0 : 1,
  hour12: hour % 12 === 0 ? 12 : hour % 12,
  minute,
});

export const fromWheel = ({
  meridiem,
  hour12,
  minute,
}: WheelTime): AlarmTime => ({
  hour: (hour12 % 12) + meridiem * 12,
  minute,
});

// 도는 칸이 직전 읽기에서 몇 칸 움직였나 — 끝없이 도는 칸은 라이브러리가 목록을 한 바퀴씩 되감아 번호가 크게 뛸 수 있다.
// 한 번 읽는 사이에 반 바퀴 넘게 움직이지는 않으니, 반 바퀴 안쪽으로 접어 실제로 움직인 칸 수로 읽는다
export const rowStep = (fromRow: number, toRow: number, length: number) => {
  const half = length / 2;
  return ((((toRow - fromRow + half) % length) + length) % length) - half;
};

// 시 칸의 몇 번째 12시 구간에 있나 — 칸 번호 11(12시)마다 새 구간이 시작한다(1시=0 … 11시=10, 12시=11)
const noonBlock = (row: number) => Math.floor((row - 11) / 12);

/**
 * iOS 알람처럼 시를 11과 12 사이로 넘기면 오전/오후가 바뀐다.
 * 넘은 사건을 세지 않고 처음 칸과 지금 칸 사이의 12시 경계 수로 정한다 — 손을 뗄 때 한 칸 되튀거나 빠르게 오가도 어긋나지 않는다
 */
export const meridiemAfter = (
  start: 0 | 1,
  fromRow: number,
  toRow: number,
): 0 | 1 => {
  const crossed = noonBlock(toRow) - noonBlock(fromRow);
  return (((start + crossed) % 2) + 2) % 2 === 0 ? 0 : 1;
};
