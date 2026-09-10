'use client';

// 내 정보(/me) — 프로필 헤더, 프리미엄 카드, 학습 · 설정 · 지원 · 계정 네 묶음. 페이지 전환 모션은 전역 라우트 트랜지션이 맡는다
import { useState, useSyncExternalStore } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { disablePushToken } from '@/features/notification/model/push-token-registration';
import { surveyDone } from '@/features/survey/model/survey-done';
import { track } from '@/shared/analytics';
import { logout as requestLogout } from '@/shared/auth/api/logout';
import { withdraw } from '@/shared/auth/api/withdraw';
import { useAuthStore } from '@/shared/auth/auth-store';
import { clearSession } from '@/shared/auth/clear-session';
import { homePath } from '@/shared/lib/last-tab';
import { MAILBOX_COMPOSE_PATH, SURVEY_PATH } from '@/shared/lib/routes';
import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { reportWarning } from '@/shared/monitoring/report';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import {
  ChevronLeftIcon,
  ClipboardListIcon,
  FileTextIcon,
  LogOutIcon,
  MessageSquareIcon,
  TrashIcon,
} from '@/shared/ui/Icons';

import { AccentMenuEntry } from './_ui/AccentMenuEntry';
import { EnglishLevelMenuEntry } from './_ui/EnglishLevelMenuEntry';
import { HapticMenuEntry } from './_ui/HapticMenuEntry';
import { MenuButton, MenuLink, MenuSection } from './_ui/Menu';
import { NotificationMenuEntry } from './_ui/NotificationMenuEntry';
import { PremiumEntry } from './_ui/PremiumEntry';
import { ProfileHeader } from './_ui/ProfileHeader';
import { WidgetMenuEntry } from './_ui/WidgetMenuEntry';

export default function MyPage() {
  const router = useRouter();
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();

  // 설문은 한 번 답하면 목록에서 빠진다. 서버 렌더에서는 숨겨 두고 클라이언트에서 저장값을 읽는다
  const surveyAnswered = useSyncExternalStore(
    surveyDone.subscribe,
    surveyDone.has,
    () => true,
  );

  // 탈퇴 시트 닫기 — 버튼·오버레이 두 경로가 같은 취소 이벤트를 쓴다
  function dismissDeleteSheet() {
    if (isDeletingAccount) return;
    track(EVENTS.CONFIRM_SHEET_DISMISSED, { sheet: 'account_delete' });
    setIsDeleteSheetOpen(false);
  }

  // 인증 상태와 쿼리 캐시를 함께 비운다 — 캐시가 남으면 다음 계정에 이전 계정 데이터가 노출된다
  function finishSignedOut() {
    clearSession();
    router.replace('/login');
  }

  // 서버 폐기가 실패해도 로컬 세션은 지우고 로그인으로 보낸다 — 사용자를 로그인 상태에 가둘 이유가 없다
  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      // 푸시 해제가 먼저다 — 토큰을 폐기한 뒤엔 인증이 필요한 이 요청을 보낼 수 없다
      await disablePushToken();
      if (refreshToken) await requestLogout(refreshToken);
    } catch (error) {
      console.warn('[Auth] logout failed:', error);
      reportWarning(error);
    } finally {
      // 세션 정리(resetUser)보다 먼저 찍어야 로그아웃한 유저에게 귀속된다
      track(EVENTS.LOGOUT_COMPLETED);
      setIsLoggingOut(false);
      finishSignedOut();
    }
  }

  // 탈퇴는 서버 성공이 먼저다 — 실패했는데 로컬만 지우면 계정이 남은 채 탈퇴된 것처럼 보인다
  async function deleteAccount() {
    if (isDeletingAccount) return;
    setIsDeletingAccount(true);
    setDeleteErrorMessage(null);
    try {
      // 탈퇴 전에 이 기기로 가는 푸시를 끊는다 — 계정이 사라진 뒤엔 해제할 방법이 없다.
      // 부가 정리라 실패해도 탈퇴 자체는 막지 않는다
      await disablePushToken().catch((error: unknown) => {
        console.warn('[push-token] 해제 실패:', error);
        reportWarning(error);
      });
      await withdraw();
      track(EVENTS.ACCOUNT_DELETED);
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
          onClick={() => router.replace(homePath())}
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
        <div className="space-y-5 px-4 pt-3 pb-8">
          <ProfileHeader />
          <PremiumEntry />

          <MenuSection title="학습">
            <EnglishLevelMenuEntry />
            <AccentMenuEntry />
          </MenuSection>

          <MenuSection title="설정">
            {/* 알림은 권한 체계가 있는 셸에서만, 위젯은 위젯이 실린 셸에서만 보인다 — 브라우저에선 진동만 남는다 */}
            <NotificationMenuEntry />
            <HapticMenuEntry />
            <WidgetMenuEntry />
          </MenuSection>

          <MenuSection title="지원">
            <MenuLink
              href={MAILBOX_COMPOSE_PATH}
              icon={<MessageSquareIcon size={22} />}
              title="피드백 남기기"
            />
            {!surveyAnswered && (
              <MenuLink
                href={SURVEY_PATH}
                icon={<ClipboardListIcon size={22} />}
                title="설문조사 참여하기"
              />
            )}
          </MenuSection>

          <MenuSection title="계정">
            <MenuLink
              href="/terms"
              icon={<FileTextIcon size={22} />}
              title="서비스 이용약관"
            />
            <MenuLink
              href="/privacy"
              icon={<FileTextIcon size={22} />}
              title="개인정보 처리방침"
            />
            <MenuButton
              title={isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              icon={<LogOutIcon size={22} />}
              chevron={false}
              onClick={logout}
              disabled={isLoggingOut}
            />
            <MenuButton
              title="회원탈퇴"
              icon={<TrashIcon size={22} />}
              tone="danger"
              chevron={false}
              onClick={() => {
                track(EVENTS.CONFIRM_SHEET_OPENED, { sheet: 'account_delete' });
                setDeleteErrorMessage(null);
                setIsDeleteSheetOpen(true);
              }}
            />
          </MenuSection>
        </div>
      </div>

      {/* 회원탈퇴 확인 바텀시트 */}
      <BottomSheet open={isDeleteSheetOpen} onClose={dismissDeleteSheet}>
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
            onClick={dismissDeleteSheet}
            disabled={isDeletingAccount}
          >
            닫기
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={deleteAccount}
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
