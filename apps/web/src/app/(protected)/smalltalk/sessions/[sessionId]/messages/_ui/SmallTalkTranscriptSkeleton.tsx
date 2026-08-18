// 대화 전문 로딩 스켈레톤 — 상대는 왼쪽(원문+번역), 나는 오른쪽(원문만) 말풍선 자리를 번갈아 잡아 대화처럼 보이게 한다.
// 실제 말풍선은 몇 줄씩 길어지므로 한 줄짜리가 아니라 두세 줄 높이로 잡는다
const BUBBLES: { mine: boolean; width: string; lines: number }[] = [
  { mine: true, width: '78%', lines: 2 },
  { mine: false, width: '78%', lines: 3 },
  { mine: true, width: '70%', lines: 2 },
  { mine: false, width: '78%', lines: 2 },
];

// 원문 한 줄(text-[15px] leading-6)과 번역 한 줄(text-[13px] leading-5) 높이
const LINE = 24;
const SUB_LINE = 20;

export const SmallTalkTranscriptSkeleton = () => (
  <div
    role="status"
    aria-label="대화를 불러오는 중"
    className="flex min-h-0 flex-1 animate-pulse flex-col gap-3 overflow-hidden px-5 pt-2 pb-8"
  >
    {BUBBLES.map(({ mine, width, lines }, index) => (
      <div
        key={index}
        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
      >
        {mine ? (
          // 내 말은 원문만 있는 주황 풍선 — 글줄 없이 풍선 자체를 옅게 잡는다
          <div
            className="rounded-2xl bg-primary/25"
            style={{ width, height: 24 + LINE * lines }}
          />
        ) : (
          // 상대 말은 원문 몇 줄 + 번역 몇 줄
          <div
            className="rounded-2xl bg-card px-4 py-3 shadow-sm"
            style={{ width }}
          >
            {Array.from({ length: lines }, (_, line) => (
              <div
                key={line}
                className="rounded bg-secondary"
                style={{
                  height: LINE - 6,
                  marginTop: line === 0 ? 3 : 9,
                  width: line === lines - 1 ? '60%' : '100%',
                }}
              />
            ))}
            <div
              className="rounded bg-secondary"
              style={{ height: SUB_LINE - 6, marginTop: 12, width: '85%' }}
            />
            <div
              className="rounded bg-secondary"
              style={{ height: SUB_LINE - 6, marginTop: 6, width: '45%' }}
            />
          </div>
        )}
      </div>
    ))}
  </div>
);
