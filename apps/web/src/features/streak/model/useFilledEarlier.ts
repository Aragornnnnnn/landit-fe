// 오늘 열매를 이미 채우고 들어온 대화인지 — 그렇다면 이번 완료로 새로 찍히는 게 없어 축하를 건너뛴다
import { useCelebrationBase } from './useCelebrationBase';

export const useFilledEarlier = () =>
  useCelebrationBase()?.activeToday === true;
