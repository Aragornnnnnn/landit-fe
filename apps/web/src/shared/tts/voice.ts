// 백엔드 ttsVoice 응답(landit-be TtsVoiceResponse)을 그대로 미러한 타입
export interface TtsVoice {
  provider: string;
  model: string;
  providerVoiceId: string;
  gender: 'FEMALE' | 'MALE';
}
