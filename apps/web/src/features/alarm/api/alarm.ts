// 사용자 일일 알람 설정 조회·저장 — 백엔드 UserAlarmResponse·UserAlarmUpdateRequest 미러 (landit-be #189).
// 서버는 설정만 저장한다. 실제 예약은 셸이 하고, 요일은 서버에 필드가 없어 기기에 둔다
import { api } from '@/shared/api/client';

export interface UserAlarmResponse {
  // 기기 현지 시각 "HH:mm". 한 번도 설정 안 했으면 null
  time: string | null;
  enabled: boolean;
}

export const getMyAlarm = () => api.get<UserAlarmResponse>('/api/v1/me/alarm');

/** 끌 때도 시각을 같이 보낸다 — 다시 켤 때 그 시각을 쓴다 */
export const updateMyAlarm = (body: { time: string; enabled: boolean }) =>
  api.put<UserAlarmResponse>('/api/v1/me/alarm', body);
