// 위젯 설치 안내를 누구에게(위젯 있는 앱), 언제(온보딩 끝), 몇 번(한 번) 보여줄지 정한다
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
  // 온보딩 끝 설치 유도를 보여줬다 — 화면 노출은 한 번만
  invited?: boolean;
}

const KEY = 'widget:install';

const read = () => readPromptEntry<InstallRecord>(KEY);
const update = (patch: Partial<InstallRecord>) =>
  updatePromptEntry<InstallRecord>(KEY, patch);

// 온보딩 끝 설치 유도 — 보여준 적 없을 때만
export const shouldInviteInstall = () => read()?.invited !== true;

export const recordInstallInvited = () => update({ invited: true });
