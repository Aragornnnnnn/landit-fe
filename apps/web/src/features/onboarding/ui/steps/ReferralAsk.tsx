// 초대 코드 단계 앞 질문 — 초대 받고 왔는지만 묻는다. 초대 없이 온 사람이 남의 돈 이야기를 보지 않게 금액은 꺼내지 않는다
'use client';

export const ReferralAsk = ({
  onYes,
  onNo,
}: {
  onYes: () => void;
  onNo: () => void;
}) => (
  <div className="flex min-h-0 flex-1 flex-col pt-7">
    <h1 className="text-3xl leading-[1.18] font-black tracking-normal break-keep">
      친구에게 초대 받고
      <br />
      오셨나요?
    </h1>

    {/* 고르는 즉시 넘어간다 — 확정 버튼을 한 번 더 누를 일이 없는 두 갈래라 배울 영어 카드처럼 생겼어도 CTA를 두지 않는다 */}
    <div className="mt-8 flex flex-col gap-3">
      <AskOption onClick={onYes}>네, 초대 코드가 있어요</AskOption>
      <AskOption onClick={onNo}>아니요</AskOption>
    </div>
  </div>
);

const AskOption = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-2xl bg-card px-4 py-4 text-left text-base font-extrabold text-foreground shadow-[0_3px_0_var(--border)] transition-[translate,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none"
  >
    {children}
  </button>
);
