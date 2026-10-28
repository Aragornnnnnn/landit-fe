// 보호 그룹 레이아웃 — 로그인한 사람만 들인다. 보호가 필요한 페이지는 이 그룹에 넣는다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

import { AuthGate } from './_ui/AuthGate';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 여러 화면이 같이 쓰는 묶음은 여기서 보낸다 — onboarding은 배울 영어 선택 폼·시작 전 질문(홈·내 정보),
  // feedback은 레벨 이름·총평 카드(대화 직후·기록·스몰톡 요약·내 정보·해지·페이월 미리보기),
  // notification은 알림 잠금화면 목업(온보딩·홈 시트), widget은 위젯 설치 안내(온보딩·내 정보),
  // subscription은 혜택 목록·결제 안내·구독 관리 문구(페이월·구독 관리·결제 내역·해지·프리미엄 환영·홈 헤더 알약),
  // alarm은 알람 등록 흐름·알람 설정(내 정보·알람 화면·프리미엄 온보딩), eventPopup은 홈 탭에 뜨는 이벤트 공지,
  // streak은 연속 기록 문구(홈 헤더 열매·연속 기록 화면·표현 학습을 마친 축하 도장),
  // expression은 표현 목록·퀴즈·분석 대기 연출(홈 카드 뒷면·스몰톡 기록·표현 학습·푸시 복습·대화 직후 분석)
  return (
    <MessagesProvider
      namespaces={[
        'onboarding',
        'feedback',
        'notification',
        'widget',
        'subscription',
        'alarm',
        'eventPopup',
        'streak',
        'expression',
      ]}
    >
      <AuthGate>{children}</AuthGate>
    </MessagesProvider>
  );
}
