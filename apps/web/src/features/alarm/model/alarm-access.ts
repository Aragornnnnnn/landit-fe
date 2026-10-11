// 알람 대상 — 유료 사용자, 또는 결제 없이 실제 흐름을 시험하는 ADMIN. 메뉴 행과 셸 예약이 같은 규칙을 본다
export const canUseAlarm = ({
  subscription,
  isAdmin,
}: {
  subscription: { premium: boolean } | null | undefined;
  isAdmin: boolean;
}) => subscription?.premium === true || isAdmin;
