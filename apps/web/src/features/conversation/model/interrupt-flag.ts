// 상대 발화 끊기 스위치 — 켜면 상대가 말하는 중에도 마이크·키보드를 눌러 바로 답할 수 있다. 시연용 임시 기능이다
// 기본은 켜짐이고 'false'를 넣을 때만 꺼진다. NEXT_PUBLIC_이라 빌드 시점에 박혀, 바꾸면 재배포가 필요하다
export const SPEECH_INTERRUPT_ENABLED =
  process.env.NEXT_PUBLIC_SPEECH_INTERRUPT_ENABLED !== 'false';
