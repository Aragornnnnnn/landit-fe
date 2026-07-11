// 인증 판단 동안 보여주는 화면 — 네이티브 스플래시(주황+흰 로고)와 같은 그림이라 어느 쪽으로 가든 이어져 보인다
import { LanditLogo } from '@/shared/ui/LanditLogo';

export const AuthSplash = () => (
  <div className="flex h-dvh items-center justify-center bg-primary">
    <LanditLogo className="h-12 w-auto text-white" />
  </div>
);
