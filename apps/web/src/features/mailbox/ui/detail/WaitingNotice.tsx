// 답장을 기다리는 중이라는 안내 — 보낸 편지가 어디로 사라진 게 아니라는 말을 대신한다
export const WaitingNotice = () => (
  <div className="rounded-2xl bg-secondary p-4">
    <p className="text-sm font-bold text-foreground">
      <span className="tossface">🕊️</span> 랜딧 팀이 확인하고 있어요
    </p>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      소중한 의견 잘 받았어요. 검토 후 답장 도착하면 알려드릴게요.
    </p>
  </div>
);
