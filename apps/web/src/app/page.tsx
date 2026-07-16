// 루트 — 지금은 홈으로 보낸다. 랜딩 페이지가 생기면 이 자리를 차지한다
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
}
