// 스몰톡 탭 — 콘텐츠가 준비되기 전이라 안내만 보여준다. 탭 칩은 아직 노출하지 않는다
export default function SmalltalkPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-2xl leading-snug font-extrabold text-foreground">
        스몰톡을 준비하고 있어요
      </p>
      <p className="text-base font-medium text-muted-foreground">
        정해진 상황 없이 편하게 나누는 대화를
        <br />곧 가져올게요
      </p>
    </div>
  );
}
