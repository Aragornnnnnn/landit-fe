// 대화 칸 말풍선의 모양 — 상대 말은 왼쪽 흰 말풍선(왼위 꼬리), 내 말은 오른쪽 연한 주황 말풍선(오른위 꼬리).
// 지금 말하는 상대 말풍선(PartnerBubble)과 지난 대화가 같은 껍데기를 써서 쌓여도 한 줄기로 읽힌다

/** 상대 말풍선의 바탕 — 흰 면·왼위 꼬리·그림자. 생각 중 점 말풍선도 같은 바탕을 쓴다 */
export const PARTNER_BUBBLE_SURFACE =
  'rounded-[18px] rounded-tl-md bg-card shadow-[0_4px_14px_rgba(0,0,0,0.08)]';

/** 상대 말풍선 껍데기 — 폭은 글 길이에 맞추되 너무 좁거나 넓지 않게 140~280 */
export const PartnerBubbleShell = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div
    className={`flex w-fit max-w-[280px] min-w-[140px] flex-col gap-[5px] self-start px-3.5 py-[9px] ${PARTNER_BUBBLE_SURFACE}`}
  >
    {children}
  </div>
);

/** 끝난 턴의 말 — 다시 듣기·해석·가리기 없이 대사만 둔다. 지금 차례의 말풍선보다 눈에 덜 띄어야 한다 */
export const PastBubble = ({
  speaker,
  text,
}: {
  speaker: 'PARTNER' | 'ME';
  text: string;
}) =>
  speaker === 'PARTNER' ? (
    <PartnerBubbleShell>
      <p className="text-16 leading-[1.35] font-bold break-words text-foreground">
        {text}
      </p>
    </PartnerBubbleShell>
  ) : (
    <div className="max-w-[280px] self-end rounded-[18px] rounded-tr-md bg-bubble-mine px-3.5 py-[9px] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
      <p className="text-16 leading-[1.35] font-medium break-words text-foreground">
        {text}
      </p>
    </div>
  );
