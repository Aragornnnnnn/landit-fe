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

interface InstallRecord {
  // 온보딩 끝 설치 유도를 보여줬다 — 화면 노출은 한 번만
  invited?: boolean;
  // 설치 유도에서 위젯 추가하기를 눌렀다 — 설치 길로 들어간 사람에겐 다시 청하지 않는다
  inviteAccepted?: boolean;
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

// 재유도해볼 만한 사람인가 — 설치 길로 들어갔거나 재유도에 이미 답한 사람만 제외한다.
// 미룬 신규 유저뿐 아니라, 유도 화면을 본 적 없는 기존 유저와 안내 도중 이탈한 사람도 포함된다
const isReinviteCandidate = (record: InstallRecord | undefined) =>
  record?.inviteAccepted !== true && record?.reinviteAnswer === undefined;

// 온보딩 끝 설치 유도 — 보여준 적 없을 때만
export const shouldInviteInstall = () => read()?.invited !== true;

export const recordInstallInvited = () => update({ invited: true });

export const recordInstallAccepted = () => update({ inviteAccepted: true });

// 대화를 마쳤다 — 재유도해볼 만한 사람에게만 차례를 남긴다 (아닌 사람에겐 쓰기 자체를 생략)
export const markTalkCompletedForWidget = () => {
  if (!isReinviteCandidate(read())) return;
  update({ pending: true, pendingOn: deviceToday() });
};

// 재유도 시트 — 재유도해볼 만한 사람이 오늘 대화를 막 마쳤을 때
export const shouldReinvite = () => {
  const record = read();
  return (
    isReinviteCandidate(record) &&
    record?.pending === true &&
    record.pendingOn === deviceToday()
  );
};

// 시트를 띄웠다 — 차례를 소비해 같은 완료로 또 뜨지 않게 한다
export const consumeReinvitePending = () => update({ pending: false });

export const recordReinviteAnswer = (answer: 'install' | 'dismiss') =>
  update({ reinviteAnswer: answer });
