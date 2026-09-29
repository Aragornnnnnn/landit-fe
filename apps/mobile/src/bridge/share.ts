// 브릿지 SHARE를 OS 공유 시트로 연다 — 시트가 뜨는 사이 연타로 같은 요청이 또 와도 한 번만 연다
import { Share } from 'react-native';

// 웹은 SHARE를 보내자마자 잠금을 푼다 — 시트가 떠 있는지는 셸만 안다
let isSheetOpen = false;

export const openShareSheet = async (message: string) => {
  if (isSheetOpen) return;
  isSheetOpen = true;
  try {
    await Share.share({ message });
  } finally {
    isSheetOpen = false;
  }
};
