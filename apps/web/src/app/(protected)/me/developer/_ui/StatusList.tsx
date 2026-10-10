// 알람 점검의 상태 목록 — 눌리지 않는 "라벨: 값" 글자를 카드 안 옅은 상자에 모아, 누르는 메뉴 줄과 섞이지 않게 한다
const TONE_CLASS = {
  default: 'text-foreground',
  danger: 'font-bold text-destructive',
  good: 'font-bold text-primary',
} as const;

// 상태 목록 — 눌리지 않는 "라벨: 값" 글자다. 메뉴 줄과 섞이지 않게 카드 안 옅은 상자에 구분선 없이 촘촘히 적는다
export const StatusList = ({
  note,
  children,
}: {
  /** 값이 아니라 설명인 한마디 — 목록 아래에 작게 적는다 */
  note?: string;
  children: React.ReactNode;
}) => (
  <div className="m-3 rounded-lg bg-muted/70 px-3.5 py-3">
    <dl className="space-y-1.5 text-[13px] leading-snug">{children}</dl>
    {note && (
      <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
        {note}
      </p>
    )}
  </div>
);

export const StatusItem = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  tone?: keyof typeof TONE_CLASS;
}) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className={`text-right ${TONE_CLASS[tone]}`}>{value}</dd>
  </div>
);
