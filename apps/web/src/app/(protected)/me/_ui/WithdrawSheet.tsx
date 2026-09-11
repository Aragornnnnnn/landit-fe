'use client';

// 회원탈퇴 확인 시트 — 자동 갱신 중인 구독이 있으면 탈퇴 대신 구독 관리로 보낸다.
// 탈퇴해도 스토어 구독은 안 끊겨 돈만 계속 나가기 때문이다. 해지 예약(자동 갱신 꺼짐)은 남은 기간만 버리는 거라 막지 않는다
import { useRouter } from 'next/navigation';

import { summarizeSubscription } from '@/features/subscription/model/subscription-summary';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { SUBSCRIPTION_MANAGE_PATH } from '@/shared/lib/routes';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface WithdrawSheetProps {
  open: boolean;
  deleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const WithdrawSheet = ({
  open,
  deleting,
  errorMessage,
  onClose,
  onConfirm,
}: WithdrawSheetProps) => {
  const router = useRouter();
  const { subscription } = useSubscriptionQuery();
  const summary = summarizeSubscription(subscription);
  // 조회 실패·아직 못 받음은 막지 않는다 — 탈퇴를 영영 못 하게 되는 쪽이 더 나쁘다
  const mustCancelFirst = summary.kind !== 'none' && summary.renews;

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-[17px] font-bold text-foreground">회원탈퇴</h2>
      {mustCancelFirst ? (
        <>
          {/* 세 문장을 한 줄씩 — 왜 안 되는지, 그래서 뭘 해야 하는지가 한눈에 읽히게 */}
          <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
            구독 중에는 탈퇴할 수 없어요.
            <br />
            탈퇴해도 스토어 결제는 계속돼요.
            <br />
            구독 관리에서 먼저 해지해 주세요.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              닫기
            </Button>
            <Button
              type="button"
              size="md"
              onClick={() => {
                onClose();
                router.push(SUBSCRIPTION_MANAGE_PATH);
              }}
            >
              구독 관리로 가기
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
            계정과 이용 기록이 삭제됩니다. 계속 진행할까요?
          </p>
          {errorMessage && (
            {/* 버튼에 포커스가 남은 채 늦게 뜨는 글이라 라이브 영역으로 — 스크린 리더가 실패를 읽어 준다 */}
            <p
              role="alert"
              className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {errorMessage}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={deleting}
            >
              닫기
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={onConfirm}
              loading={deleting}
              disabled={deleting}
            >
              {deleting ? '처리 중' : '탈퇴할게요'}
            </Button>
          </div>
        </>
      )}
    </BottomSheet>
  );
};
