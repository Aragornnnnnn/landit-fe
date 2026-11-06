// 캐릭터를 눌러 인사를 들어 본 기기인지 — 아직이면 스몰톡 화면이 캐릭터 옆에 "누르면 인사해요" 힌트를 둔다.
// 탭 셸의 칩 점은 이게 아니라 첫 안내를 봤는지(intro-guide-seen)를 본다
import { seenFlag } from '@/shared/lib/seen-flag';

export const tapGreetingSeen = seenFlag('landit-smalltalk-tap-greeting-seen');
