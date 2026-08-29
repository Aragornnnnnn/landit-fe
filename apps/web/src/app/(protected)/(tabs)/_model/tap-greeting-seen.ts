// 캐릭터를 누르면 인사한다는 걸 배운 기기인지 — 딤 코치마크는 처음 한 번만 띄운다.
// 아직 안 배운 사람에겐 탭 셸이 스몰톡 칩에 점을 붙여 눈짓하므로, 스몰톡 화면과 셸이 함께 본다
import { seenFlag } from '@/shared/lib/seen-flag';

export const tapGreetingSeen = seenFlag('landit-smalltalk-tap-greeting-seen');
