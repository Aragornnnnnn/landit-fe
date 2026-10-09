// 닉네임 변경 — 백엔드 UserNicknameUpdateRequest·UserNicknameResponse 미러
import { api } from '@/shared/api/client';

export interface UserNicknameResponse {
  // 앞뒤 공백을 떼고 저장한 값
  nickname: string;
}

export const updateNickname = (nickname: string) =>
  api.put<UserNicknameResponse>('/api/v1/me/nickname', { nickname });
