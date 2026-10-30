// 무료 표현을 마친 무료 사용자에게 스몰톡 칩 말풍선으로 「무료 5분」을 알린다 — 마친 것과 스몰톡에 들어가 본 것을 이 기기에 남긴다
import { seenFlag } from '@/shared/lib/seen-flag';

// 프리미엄 프리뷰의 무료 표현을 끝까지 마쳤다 — 넘기거나 중간에 나온 사람에겐 말풍선을 띄우지 않는다
export const freeExpressionFinished = seenFlag(
  'landit-free-expression-finished',
);
// 말풍선을 보고 스몰톡 탭에 들어가 봤다 — 그 뒤로는 다시 띄우지 않는다
export const smalltalkNudgeSeen = seenFlag('landit-smalltalk-free-nudge-seen');
