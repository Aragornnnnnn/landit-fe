// 위젯 설치 안내를 누구에게(위젯 있는 앱), 언제(온보딩 끝·대화 직후), 몇 번(각 한 번) 보여줄지 정한다
import type { NativeContext } from '@landit/bridge';

import {
  deviceToday,
  readPromptEntry,
  updatePromptEntry,
} from '@/shared/lib/prompt-store';

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

interface InstallRecord extends Record<string, unknown> {
  // 온보딩 끝 설치 유도를 보여줬다 — 한 번만
  invited?: boolean;
  // 나중에 하기를 눌렀다 — 재유도 자격이 생긴다
  deferred?: boolean;
  // 대화를 마치고 아직 홈에서 재유도를 안 봤다 — 시트를 띄우는 순간 소비한다
  pending?: boolean;
  // 그 대화를 마친 날(기기 기준) — 오늘 마친 차례만 친다
  pendingOn?: string;
  // 재유도에 답했다(설치로 가든 거절이든) — 이후 다시 묻지 않는다
  reinviteAnswer?: 'install' | 'dismiss';
}

const KEY = 'widget:install';

const read = () => readPromptEntry<InstallRecord>(KEY);
const update = (patch: Partial<InstallRecord>) =>
  updatePromptEntry<InstallRecord>(KEY, patch);

// 온보딩 끝 설치 유도 — 보여준 적 없을 때만
export const shouldInviteInstall = () => read()?.invited !== true;

export const recordInstallInvited = () => update({ invited: true });

export const recordInstallDeferred = () => update({ deferred: true });

// 대화를 마쳤다 — 홈에 돌아오면 재유도를 물을 차례라고 남긴다
export const markTalkCompletedForWidget = () =>
  update({ pending: true, pendingOn: deviceToday() });

// 재유도 시트 — 미룬 사람이 오늘 대화를 막 마쳤고 아직 답한 적 없을 때 한 번
export const shouldReinvite = () => {
  const record = read();
  return (
    record?.deferred === true &&
    record.pending === true &&
    record.pendingOn === deviceToday() &&
    record.reinviteAnswer === undefined
  );
};

// 시트를 띄웠다 — 차례를 소비해 같은 완료로 또 뜨지 않게 한다
export const consumeReinvitePending = () => update({ pending: false });

export const recordReinviteAnswer = (answer: 'install' | 'dismiss') =>
  update({ reinviteAnswer: answer });
