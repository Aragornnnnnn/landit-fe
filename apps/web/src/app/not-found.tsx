// 알 수 없는 경로 — 404 화면 대신 홈으로 보낸다 (미로그인이면 protected 가드가 로그인으로 잇는다)
import { redirect } from 'next/navigation';

export default function NotFound() {
  redirect('/home');
}
