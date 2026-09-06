'use client';

// "기타 (직접 입력)"을 고르면 열리는 한 줄 입력칸 — 단일·복수 선택이 같이 쓴다
const MAX_LENGTH = 100;

export const OtherInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <input
    type="text"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    maxLength={MAX_LENGTH}
    placeholder="어떤 건지 적어주세요"
    aria-label="기타 내용"
    // 기타를 고른 직후라 바로 쓸 수 있게 초점을 준다
    autoFocus
    className="w-full shrink-0 rounded-2xl border border-border bg-card px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
  />
);
