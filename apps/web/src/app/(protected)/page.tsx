'use client';

// 홈 — 로그인 성공 확인용: 로그인한 사용자 정보를 보여준다 (시나리오 페이지로 대체 예정)
import { useAuthStore } from '@/store/auth-store';

export default function HomePage() {
  const member = useAuthStore((state) => state.member);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-3 bg-background px-6">
      <span className="tossface text-5xl">🛬</span>
      <h1 className="text-3xl font-black text-foreground">landit</h1>
      <p className="text-sm font-medium text-muted-foreground">
        로그인에 성공했어요
      </p>

      <dl className="mt-4 w-full rounded-xl bg-muted p-4 text-sm">
        <div className="flex justify-between py-1">
          <dt className="font-medium text-muted-foreground">닉네임</dt>
          <dd className="font-semibold text-foreground">
            {member?.nickname ?? '(없음)'}
          </dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="font-medium text-muted-foreground">이메일</dt>
          <dd className="font-semibold text-foreground">
            {member?.email ?? '(없음)'}
          </dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="font-medium text-muted-foreground">로그인 방식</dt>
          <dd className="font-semibold text-foreground">{member?.provider}</dd>
        </div>
      </dl>
    </main>
  );
}
