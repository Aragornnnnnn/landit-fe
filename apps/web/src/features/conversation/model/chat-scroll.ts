// 대화 칸 스크롤 판정 — 최신 대화를 보는 중인지, 새 말풍선이 오거나 말이 이어질 때 어디로 내릴지 정한다

interface ScrollBox {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

// 맨 아래로 친다 — 소수점 반올림·관성 스크롤 끝자락에 몇 px 남아도 최신을 보는 중이다
const LATEST_TOLERANCE_PX = 8;

/** 최신 대화(맨 아래)를 보는 중인가 — 끌어 올려 지난 대화를 보는 중엔 자동으로 내리지 않는다 */
export const isAtLatest = ({
  scrollTop,
  clientHeight,
  scrollHeight,
}: ScrollBox) =>
  scrollHeight - (scrollTop + clientHeight) <= LATEST_TOLERANCE_PX;

/**
 * 새 말풍선이 온 뒤 설 자리 — 칸에 다 들어가면 맨 아래, 칸보다 길면 첫 줄부터 읽게 말풍선 위끝을 흐림 띠 바로 아래에 맞춘다.
 * latestTop은 스크롤 내용 안에서 새 말풍선 위끝의 위치다
 */
export const scrollTopForLatest = ({
  clientHeight,
  scrollHeight,
  latestTop,
  fadePx,
}: Omit<ScrollBox, 'scrollTop'> & { latestTop: number; fadePx: number }) => {
  const bottom = scrollHeight - clientHeight;
  return Math.min(bottom, Math.max(0, latestTop - fadePx));
};

/**
 * 말하는 줄·펼친 해석을 따라간다 — 대상 아래끝이 칸 아래로 넘어가면 넘친 만큼만 내린다.
 * 대상이 칸보다 길면 첫 줄이 흐림 띠 위로 밀려나지 않게 거기서 멈춘다. 위치는 스크롤 내용 기준이다
 */
export const scrollTopToFollow = ({
  scrollTop,
  clientHeight,
  targetTop,
  targetBottom,
  fadePx,
}: Omit<ScrollBox, 'scrollHeight'> & {
  targetTop: number;
  targetBottom: number;
  fadePx: number;
}) =>
  Math.max(
    scrollTop,
    Math.min(targetBottom - clientHeight, targetTop - fadePx),
  );

// 따라가기 판정 여유 — 맞춰 둔 자리에서 반올림·관성으로 몇 px 어긋나도 따라가는 중이다
const FOLLOW_TOLERANCE_PX = 2;

/**
 * 최신 대화를 따라가는 중인가 — 맨 아래이거나, 최신 말 아래끝이 보이거나, 새 말풍선 위끝이 흐림 띠에 닿을 만큼 내려와 있으면 그렇다.
 * 긴 말풍선은 첫 줄에 맞춰 두고, 말하는 줄·점 말풍선은 그 아래끝까지만 내리므로 맨 아래가 아니어도 따라가는 중이다.
 * 그보다 위로 올렸으면 지난 대화를 보는 중이다. 위치는 스크롤 내용 기준이다
 */
export const isFollowingLatest = ({
  latestTop,
  latestBottom,
  fadePx,
  ...box
}: ScrollBox & { latestTop: number; latestBottom: number; fadePx: number }) =>
  isAtLatest(box) ||
  box.scrollTop + box.clientHeight >= latestBottom - FOLLOW_TOLERANCE_PX ||
  box.scrollTop >= latestTop - fadePx - FOLLOW_TOLERANCE_PX;
