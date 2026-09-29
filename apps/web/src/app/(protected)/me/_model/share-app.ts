// 친구에게 공유하기 — 공유 문구를 만들고, 셸 공유 시트·웹 공유·링크 복사 중 쓸 수 있는 길로 보낸다
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';

// SHARE를 알아듣는 최소 브릿지 계약 버전
const SHARE_BRIDGE_VERSION = 6;

export type ShareMethod = 'native_sheet' | 'web_share' | 'copy';

// 받는 사람 기기에 맞는 스토어로 보내는 /download에 친구 공유 유입 딱지를 붙인다 (docs/analytics-utm.md).
// 도메인은 고정한다 — 개발 서버에서 눌러도 친구에게는 실제 주소가 가야 한다
export const SHARE_MESSAGE =
  '랜딧에서 영어 공부 같이 해요 🙌\nhttps://landit.im/download?utm_source=share&utm_medium=referral&utm_campaign=friend_invite';

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
 * 공유 문구를 보낸다. 셸이 SHARE를 알면 OS 공유 시트, 아니면 웹 공유, 둘 다 안 되면 클립보드 복사.
 *
 * @returns 실제로 쓴 길 — 복사면 호출부가 복사했다고 알려야 한다
 * @throws 클립보드 복사까지 실패하면 그 에러
 */
export const shareApp = async (message: string): Promise<ShareMethod> => {
  const context = getNativeContext();
  if (context && context.bridgeVersion >= SHARE_BRIDGE_VERSION) {
    postToNative({ type: 'SHARE', message });
    return 'native_sheet';
  }

  if (await tryWebShare(message)) return 'web_share';

  await navigator.clipboard.writeText(message);
  return 'copy';
};
