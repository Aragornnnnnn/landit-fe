// 리뷰 닉네임 가리기 — 남의 닉네임을 그대로 광고에 쓰지 않는다
/** 다섯 글자까지는 첫 글자, 그보다 길면 앞 두 글자만 남기고 나머지는 *. 한 글자여도 * 하나는 붙인다 */
export const maskName = (name: string) => {
  const chars = [...name];
  const keep = chars.length > 5 ? 2 : 1;
  return (
    chars.slice(0, keep).join('') + '*'.repeat(Math.max(1, chars.length - keep))
  );
};
