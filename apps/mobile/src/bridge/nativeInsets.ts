// 셸이 잰 시스템 바 inset을 웹 주입 스크립트로 만든다 — Android에서만
import { Platform } from 'react-native';
import { buildNativeInsetsScript } from '@landit/bridge';
import type { EdgeInsets } from 'react-native-safe-area-context';

// iOS는 env()가 정확해 주입하지 않는다
export const getNativeInsetsScript = ({ top, bottom }: EdgeInsets) =>
  Platform.OS === 'android' ? buildNativeInsetsScript({ top, bottom }) : null;
