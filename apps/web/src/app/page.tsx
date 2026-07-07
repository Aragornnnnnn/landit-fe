// 홈 화면 placeholder — 디자인 토큰(색·폰트·이모지) 동작 확인용. 실제 화면은 기능 이슈에서 구현한다
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <span className="tossface text-5xl">🛬</span>
      <h1 className="text-3xl font-black text-foreground">landit</h1>
      <p className="text-sm font-medium text-muted-foreground">
        외국인과의 실전 회화, 미리 연습해요
      </p>
      <span className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
        디자인 토큰 적용됨
      </span>
    </main>
  );
}
