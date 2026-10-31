// 시나리오 대화의 피드백을 한 번이라도 본 기기인지 — 홈 스몰톡 칩 말풍선(무료 5분)이 이 사람에게 뜬다.
// 피드백 화면이 떠날 때 남기고, 탭 셸이 본다. 표현을 마쳤든 중간에 나갔든 프리뷰를 건너뛰었든 상관없다
import { seenFlag } from '@/shared/lib/seen-flag';

export const scenarioFeedbackSeen = seenFlag('landit-scenario-feedback-seen');
