'use client';

// 내 정보(/me) — 프로필 헤더 + 메뉴 목록. 페이지 전환 모션은 전역 라우트 트랜지션 도입 시 함께 다룬다
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { logout as requestLogout } from '@/api/auth/logout';
import { withdraw } from '@/api/auth/withdraw';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ChevronLeftIcon } from '@/components/ui/Icons';
import { useScrollShadow } from '@/hooks/useScrollShadow';
import { useAuthStore } from '@/store/auth-store';

import { MenuButton, MenuGroup, MenuLink } from './_components/Menu';
import { StatChip } from './_components/StatChip';

export default function MyPage() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();

  const displayName = member?.nickname?.trim() || '게스트';
  const emailText = member?.email ?? '';

  function finishSignedOut() {
    clearAuth();
    router.replace('/login');
  }

  // 서버 폐기가 실패해도 로컬 세션은 지우고 로그인으로 보낸다 — 사용자를 로그인 상태에 가둘 이유가 없다
  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (refreshToken) await requestLogout(refreshToken);
    } catch (error) {
      console.warn('[Auth] logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      finishSignedOut();
    }
  }

  // 탈퇴는 서버 성공이 먼저다 — 실패했는데 로컬만 지우면 계정이 남은 채 탈퇴된 것처럼 보인다
  async function handleDeleteAccount() {
    if (isDeletingAccount) return;
    setIsDeletingAccount(true);
    setDeleteErrorMessage(null);
    try {
      await withdraw();
      finishSignedOut();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '회원탈퇴에 실패했습니다.';
      setDeleteErrorMessage(message);
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <main className="flex h-dvh flex-col bg-background">
      {/* 헤더 */}
      <header
        className="relative flex items-center border-b border-border px-4 transition-shadow duration-200"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          paddingBottom: 8,
          boxShadow: hasShadow ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <button
          type="button"
          onClick={() => router.replace('/home')}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 active:bg-zinc-200"
          style={{ color: '#444', marginLeft: -4 }}
          aria-label="뒤로 가기"
        >
          <ChevronLeftIcon />
        </button>
        <h1
          className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold"
          style={{ color: '#111' }}
        >
          내 정보
        </h1>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto bg-muted"
      >
        {/* 프로필 섹션 */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-4xl"
              style={{ background: '#E8F4E8' }}
            >
              <span className="tossface">🛬</span>
            </div>
            <div className="min-w-0">
              <p
                className="text-[22px] leading-tight font-bold"
                style={{ color: '#111' }}
              >
                {displayName}
              </p>
              {emailText ? (
                <p
                  className="mt-0.5 truncate text-[14px]"
                  style={{ color: '#888' }}
                >
                  {emailText}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <StatChip
              label="로그인"
              value={getProviderLabel(member?.provider)}
            />
          </div>
        </div>

        {/* 메뉴 그룹 */}
        <div className="space-y-3 px-4 pb-8">
          <MenuGroup>
            <MenuLink href="/privacy" title="개인정보 처리방침" />
            <MenuLink href="/terms" title="서비스 이용약관" />
          </MenuGroup>

          <MenuGroup>
            <MenuButton
              title={isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              onClick={handleLogout}
              disabled={isLoggingOut}
            />
            <MenuButton
              title="회원탈퇴"
              tone="danger"
              onClick={() => {
                setDeleteErrorMessage(null);
                setIsDeleteSheetOpen(true);
              }}
            />
          </MenuGroup>
        </div>
      </div>

      {/* 회원탈퇴 확인 바텀시트 */}
      <BottomSheet
        open={isDeleteSheetOpen}
        onClose={() => !isDeletingAccount && setIsDeleteSheetOpen(false)}
      >
        <h2 className="text-[17px] font-bold" style={{ color: '#111' }}>
          회원탈퇴
        </h2>
        <p className="mt-2 text-[14px] leading-6" style={{ color: '#666' }}>
          계정과 이용 기록이 삭제됩니다. 계속 진행할까요?
        </p>
        {deleteErrorMessage && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {deleteErrorMessage}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setIsDeleteSheetOpen(false)}
            disabled={isDeletingAccount}
          >
            닫기
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleDeleteAccount}
            loading={isDeletingAccount}
            disabled={isDeletingAccount}
          >
            {isDeletingAccount ? '처리 중' : '탈퇴할게요'}
          </Button>
        </div>
      </BottomSheet>
    </main>
  );
}

function getProviderLabel(provider?: string) {
  switch (provider) {
    case 'GOOGLE':
      return '구글';
    case 'KAKAO':
      return '카카오';
    case 'APPLE':
      return '애플';
    default:
      return '-';
  }
}
