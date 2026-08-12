// 스몰톡 API — 주소는 백엔드가 부르는 이름(free-talk) 그대로, 코드 어휘는 우리 이름(스몰톡)으로 쓴다.
// 세션 타입을 가리지 않는 종료·속마음은 여기 없다 — features/conversation의 공용 세션 API에 있다.
import { api } from '@/shared/api/client';

export interface SmallTalkTopic {
  topicId: number;
  displayName: string;
  displayOrder: number;
}

// 스몰톡 홈이 한 번에 받는 것 — 고를 주제와 오늘 남은 발화 예산
export interface SmallTalkMainResponse {
  topics: SmallTalkTopic[];
  dailySpeakingTimeLimitMs: number;
  usedSpeakingTimeMs: number;
  remainingSpeakingTimeMs: number;
  // 오늘 예산을 다 썼는지는 서버가 판정한다 — 남은 시간으로 프론트가 유추하지 않는다
  canStart: boolean;
}

export const getSmallTalkTopics = () =>
  api.get<SmallTalkMainResponse>('/api/v1/free-talk/topics');
