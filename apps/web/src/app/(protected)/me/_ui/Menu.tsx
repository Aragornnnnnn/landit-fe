// iOS 설정풍 메뉴 — 흰 카드 그룹 안에 링크·버튼 행이 쌓인다
import Link from 'next/link';

import { ChevronRightIcon } from '@/shared/ui/Icons';

export function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ background: '#fff' }}>
      {children}
    </div>
  );
}

export function MenuLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] items-center justify-between border-b px-4 last:border-b-0 active:bg-gray-50"
      style={{ borderColor: '#F2F2F7' }}
    >
      <span className="text-[15px]" style={{ color: '#111' }}>
        {title}
      </span>
      <ChevronRightIcon
        size={16}
        className="shrink-0"
        style={{ color: '#C7C7CC' }}
      />
    </Link>
  );
}

export function MenuButton({
  title,
  tone = 'default',
  disabled,
  onClick,
}: {
  title: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[52px] w-full items-center justify-between border-b px-4 last:border-b-0 active:bg-gray-50 disabled:opacity-50"
      style={{ borderColor: '#F2F2F7' }}
    >
      <span
        className="text-[15px]"
        style={{ color: tone === 'danger' ? '#FF3B30' : '#111' }}
      >
        {title}
      </span>
      <ChevronRightIcon
        size={16}
        className="shrink-0"
        style={{ color: '#C7C7CC' }}
      />
    </button>
  );
}
