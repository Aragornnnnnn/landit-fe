// 롤플레이 입력 한 칸 — 라벨 + 글이 길어지면 줄 수만큼 늘어나는 칸(안쪽 스크롤 없음, 편지함 글쓰기와 같은 규격).
// 아이디어를 받는 동안엔 빈 칸에 회색 막대가 깜빡이고, 있던 글은 흐려진 채 남는다
import { useId } from 'react';

interface RoleplayFieldProps {
  label: string;
  placeholder: string;
  value: string;
  // 비어 있을 때의 크기 — 상황 칸만 처음부터 여러 줄 크기다
  size: 'line' | 'block';
  // 아이디어를 받는 중 — 고칠 수 없게 잠근다
  loading: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

// 숨은 거울과 칸이 같은 글자·여백을 써야 높이가 맞는다
const TEXT_BOX =
  'col-start-1 row-start-1 w-full rounded-2xl border p-4 text-15 leading-normal break-words whitespace-pre-wrap';

const MIN_HEIGHT = { line: 'min-h-[58px]', block: 'min-h-[104px]' } as const;

export const RoleplayField = ({
  label,
  placeholder,
  value,
  size,
  loading,
  autoFocus,
  onChange,
}: RoleplayFieldProps) => {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {/* 칸은 거울(숨은 글자)이 늘어난 만큼 따라 늘어난다 — iOS WebView가 field-sizing을 몰라 CSS 격자로 맞춘다 */}
      <div className="relative grid">
        <span
          aria-hidden
          className={`${TEXT_BOX} ${MIN_HEIGHT[size]} invisible border-transparent`}
        >
          {`${value} `}
        </span>
        <textarea
          id={id}
          // 기본 두 줄 높이가 거울보다 커지지 않게 한 줄로 두고, 높이는 거울이 정한다
          rows={1}
          value={value}
          // 받는 동안 빈 칸엔 회색 막대가 서므로 예시 글을 겹쳐 두지 않는다
          placeholder={loading ? '' : placeholder}
          readOnly={loading}
          // 빈 화면에서 어디부터 쓰는지 바로 보여 준다
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          className={`${TEXT_BOX} ${MIN_HEIGHT[size]} resize-none overflow-hidden border-border bg-card text-foreground transition-opacity placeholder:text-muted-foreground focus:border-primary focus:outline-none ${loading && value ? 'opacity-35' : ''}`}
        />
        {loading && !value && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-4.5 flex animate-pulse flex-col gap-2"
          >
            <span className="h-3 w-2/3 rounded-full bg-secondary" />
            {size === 'block' && (
              <span className="h-3 w-2/5 rounded-full bg-secondary" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
