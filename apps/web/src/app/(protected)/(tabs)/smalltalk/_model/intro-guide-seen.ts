// 스몰톡 첫 안내를 본 기기인지 — 처음 들어온 사람에게만 한 번 띄운다
import { seenFlag } from '@/shared/lib/seen-flag';

// 안내 내용이 바뀌면 v를 올려 본 사람에게도 한 번 더 띄운다
export const introGuideSeen = seenFlag('landit-smalltalk-intro-guide-seen-v2');
