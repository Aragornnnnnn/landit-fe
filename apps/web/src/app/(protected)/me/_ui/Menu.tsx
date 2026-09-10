// iOS 설정풍 메뉴 — 회색 바탕 위 흰 카드 묶음. 묶음 제목, 토스페이스 이모지 아이콘, 행(링크·버튼·토글)을 여기서만 그린다
import Link from 'next/link';

import { ChevronRightIcon } from '@/shared/ui/Icons';

const ROW_CLASS =
  'flex min-h-[54px] w-full items-center gap-3.5 border-b px-4 last:border-b-0 active:bg-gray-50';
const ROW_STYLE = { borderColor: '#F2F2F7' };
const DANGER = '#FF3B30';

export function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ background: '#fff' }}>
      {children}
    </div>
  );
}

/** 제목 붙은 카드 묶음 — 학습 · 설정 · 지원 · 계정 */
export function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="mb-2 ml-1.5 text-[12px] font-medium"
        style={{ color: '#6b7280' }}
      >
        {title}
      </h2>
      <MenuGroup>{children}</MenuGroup>
    </section>
  );
}

const Chevron = () => (
  <ChevronRightIcon
    size={16}
    className="shrink-0"
    style={{ color: '#C7C7CC' }}
  />
);

interface RowContentProps {
  icon?: React.ReactNode;
  title: string;
  tone?: 'default' | 'danger';
  trailing?: React.ReactNode;
}

// 행의 속 — 아이콘, 제목, 오른쪽 끝. 링크·버튼·토글이 껍데기만 다르게 감싼다
const RowContent = ({
  icon,
  title,
  tone = 'default',
  trailing,
}: RowContentProps) => {
  const color = tone === 'danger' ? DANGER : '#111';
  return (
    <>
      {icon && (
        // 이모지는 부모 font-size를 따른다 — 행 글자보다 한 단계 크게
        <span
          className="flex size-6 shrink-0 items-center justify-center text-[19px]"
          style={{ color }}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 text-left text-[14.5px]" style={{ color }}>
        {title}
      </span>
      {trailing}
    </>
  );
};

export function MenuLink({
  href,
  title,
  icon,
  onClick,
}: {
  href: string;
  title: string;
  icon?: React.ReactNode;
  /** 계측용 — 이동은 링크가 한다 */
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={ROW_CLASS} style={ROW_STYLE}>
      <RowContent icon={icon} title={title} trailing={<Chevron />} />
    </Link>
  );
}

export function MenuButton({
  title,
  icon,
  tone = 'default',
  disabled,
  chevron = true,
  onClick,
}: {
  title: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  /** 다른 화면으로 이어지지 않는 행(로그아웃·탈퇴)은 화살표를 뺀다 */
  chevron?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${ROW_CLASS} disabled:opacity-50`}
      style={ROW_STYLE}
    >
      <RowContent
        icon={icon}
        title={title}
        tone={tone}
        trailing={chevron ? <Chevron /> : null}
      />
    </button>
  );
}

export function MenuToggle({
  title,
  icon,
  checked,
  onChange,
}: {
  title: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={ROW_CLASS} style={ROW_STYLE}>
      <RowContent
        icon={icon}
        title={title}
        trailing={
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={title}
            onClick={() => onChange(!checked)}
            className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors"
            style={{ background: checked ? '#e07a3a' : '#D1D1D6' }}
          >
            <span
              className="absolute top-[3px] size-5 rounded-full bg-white shadow transition-transform"
              style={{
                left: 3,
                transform: checked ? 'translateX(18px)' : 'none',
              }}
            />
          </button>
        }
      />
    </div>
  );
}
