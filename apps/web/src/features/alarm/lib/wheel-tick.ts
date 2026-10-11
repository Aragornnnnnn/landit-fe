'use client';

// 휠 틱 소리 — 한 칸 넘어갈 때 짧게 "틱". 파일 없이 Web Audio로 만든다.
// iOS 웹뷰는 사용자 터치 뒤에야 소리를 낼 수 있어서, 휠을 잡는 순간 unlockWheelTick으로 깨워 둔다
let context: AudioContext | null = null;

const audioContext = () => {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  context ??= new AudioContext();
  return context;
};

// 멈춰 있으면 깨운다 — iOS는 앱을 다녀오거나 전화·알람 뒤에 suspended 말고 interrupted로 멈추기도 한다
export const unlockWheelTick = () => {
  const ctx = audioContext();
  if (ctx && ctx.state !== 'running') void ctx.resume();
};

export const playWheelTick = () => {
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(1800, now);
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.025);
};

// 휠이 화면에서 사라지면 소리 장치를 잠재운다 — 다음에 휠을 잡으면 unlockWheelTick이 다시 깨운다
export const suspendWheelTick = () => {
  if (context?.state === 'running') void context.suspend();
};
