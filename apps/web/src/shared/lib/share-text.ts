// 글 공유하기 — 셸 공유 시트·웹 공유·클립보드 복사 중 쓸 수 있는 길로 보낸다. 앱 공유와 친구 초대가 같이 쓴다
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';

// SHARE를 알아듣는 최소 브릿지 계약 버전
const SHARE_BRIDGE_VERSION = 6;

export type ShareMethod = 'native_sheet' | 'web_share' | 'copy';

// 웹 공유 시트를 열었으면 true — 사용자가 닫은 것도 연 것이다. 막혔거나 없으면 false
const tryWebShare = async (message: string) => {
  if (!navigator.share) return false;
  try {
    await navigator.share({ text: message });
    return true;
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError';
  }
};

/**
 * 글을 보낸다. 셸이 SHARE를 알면 OS 공유 시트, 아니면 웹 공유, 둘 다 안 되면 클립보드 복사.
 *
 * @returns 실제로 쓴 길 — 복사면 호출부가 복사했다고 알려야 한다
 * @throws 클립보드 복사까지 실패하면 그 에러
 */
export const shareText = async (message: string): Promise<ShareMethod> => {
  const context = getNativeContext();
  if (context && context.bridgeVersion >= SHARE_BRIDGE_VERSION) {
    postToNative({ type: 'SHARE', message });
    return 'native_sheet';
  }

  if (await tryWebShare(message)) return 'web_share';

  await navigator.clipboard.writeText(message);
  return 'copy';
};
