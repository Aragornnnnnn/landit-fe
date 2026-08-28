// 프롬프트류(한 번만 묻는 안내) 기록의 공용 저장소 — localStorage 키 하나에 JSON으로 모은다
// 물어본 것이 늘어도 키가 흩어지지 않게, 소감·위젯 설치 등 모든 프롬프트 기록이 이 버킷을 쓴다

export const PROMPT_RECORD_KEY = 'landit-prompts';

type PromptRecords = Record<string, Record<string, unknown> | undefined>;

const readAll = (): PromptRecords => {
  try {
    const raw = localStorage.getItem(PROMPT_RECORD_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? (parsed as PromptRecords)
      : {};
  } catch {
    // 없거나 깨진 값은 기록이 없는 것과 같다 — 한 번 더 묻는 정도라 감수한다
    return {};
  }
};

export const readPromptEntry = <T extends object>(key: string): T | undefined =>
  readAll()[key] as T | undefined;

export const updatePromptEntry = <T extends object>(
  key: string,
  patch: Partial<T>,
) => {
  try {
    const all = readAll();
    all[key] = { ...all[key], ...patch };
    localStorage.setItem(PROMPT_RECORD_KEY, JSON.stringify(all));
  } catch {
    // 저장 실패는 무시 — 다음 기회에 한 번 더 뜰 뿐이다
  }
};

// 기기 기준 오늘 (yyyy-MM-dd) — "막 마쳤다" 같은 당일 판정에 쓴다
export const deviceToday = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
