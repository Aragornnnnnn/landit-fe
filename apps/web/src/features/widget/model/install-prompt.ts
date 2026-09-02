// 위젯 설치 안내를 누구에게(위젯 있는 앱), 언제(온보딩 끝·스트릭 클리어), 몇 번 보여줄지 정한다
import type { NativeContext } from '@landit/bridge';

import { readPromptEntry, updatePromptEntry } from '@/shared/lib/prompt-store';

// 위젯이 처음 실린 앱 버전 — 이보다 낮으면 안내해봐야 설치할 위젯이 없다
const MIN_WIDGET_VERSION = [1, 2, 0] as const;

// 셸 안이고 앱 버전이 위젯을 실은 뒤일 때만 안내한다. 브라우저·구버전·형식 밖 버전은 전부 제외
export const supportsWidgetInstall = (
  context: NativeContext | null,
): boolean => {
  if (context === null) return false;
  const parts = context.appVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return false;
  for (let i = 0; i < 3; i += 1) {
    if (parts[i] > MIN_WIDGET_VERSION[i]) return true;
    if (parts[i] < MIN_WIDGET_VERSION[i]) return false;
  }
  return true;
};

interface InstallRecord {
  // 온보딩 위젯 스텝을 보여줬다 — 화면 노출은 한 번만
  invited?: boolean;
  // "위젯 추가하기"를 눌렀다(온보딩이든 재유도든) — 설치 길로 들어간 사람에겐 다시 청하지 않는다
  inviteAccepted?: boolean;
  // 스트릭 클리어 2차 재유도를 이미 한 번 띄웠다 — 매 클리어마다 조르지 않게 한 번만
  reinvited?: boolean;
}

const KEY = 'widget:install';

const read = () => readPromptEntry<InstallRecord>(KEY);
const update = (patch: Partial<InstallRecord>) =>
  updatePromptEntry<InstallRecord>(KEY, patch);

// 온보딩 위젯 스텝 — 보여준 적 없을 때만
export const shouldInviteInstall = () => read()?.invited !== true;

export const recordInstallInvited = () => update({ invited: true });

// "위젯 추가하기"를 눌렀다 — 이후 재유도로 다시 붙잡지 않는다
export const recordInstallAccepted = () => update({ inviteAccepted: true });

// 스트릭 클리어 2차 재유도 자격 — 온보딩 유도를 봤지만 설치 안 했고, 아직 재유도를 안 띄운 사람
export const shouldReinviteOnStreak = () => {
  const record = read();
  return (
    record?.invited === true &&
    record.inviteAccepted !== true &&
    record.reinvited !== true
  );
};

// 재유도를 띄웠다 — 한 번으로 끝낸다
export const recordReinvited = () => update({ reinvited: true });
