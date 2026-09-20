// 사용자 메시지에 붙는 피드백(교정·배운 표현 재사용) 판단 — 아직 만드는 중인지, 강조할 구절을 어디서 자를지.
// 대화 보기가 밑줄에 쓰고, 오늘의 스몰톡(후속 PR)이 인용문 굵게에 같은 자르기를 쓴다
import type { SmallTalkHistoryMessage } from '../api/small-talk';

// 교정을 아직 만드는 중인 사용자 메시지가 있는가 — 있으면 세션을 다시 물어야 한다
export const hasPendingCorrection = (messages: SmallTalkHistoryMessage[]) =>
  messages.some((message) => message.correctionStatus === 'PREPARING');

export interface MatchedSplit {
  before: string;
  match: string;
  after: string;
}

// 원문 안에서 강조할 구절을 찾아 앞·구절·뒤로 나눈다.
// 강조할 구절이 없거나(undefined·빈 문자열) 원문에 안 들어 있으면 null — 화면은 원문만 그린다.
// 명세상 구절은 원문에 반드시 들어 있지만, 서버 데이터가 어긋나도 화면이 깨지지 않게 한다
export const splitMatchedText = (
  content: string,
  matchedText: string | undefined,
): MatchedSplit | null => {
  if (!matchedText) return null;
  const index = content.indexOf(matchedText);
  if (index < 0) return null;
  return {
    before: content.slice(0, index),
    match: matchedText,
    after: content.slice(index + matchedText.length),
  };
};
