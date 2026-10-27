// 셸이 직접 그리는 문구 — 오류 화면·알람 버튼·위젯 요일·결제·로그인 오류. 웹과 같은 용어를 쓴다(docs/i18n-glossary.md)
import type { ShellLocale } from './shell-locale';

const ko = {
  loadFailed: {
    title: '화면을 불러오지 못했어요',
    description: '네트워크 연결을 확인하고\n다시 시도해 주세요',
    retryButton: '다시 시도할게요',
  },
  alarm: {
    goButton: '대화하러 가기',
    stopButton: '끄기',
    // 안드로이드 알림에만 뜬다 — 비워 두면 라이브러리가 영어 "Alarm"을 넣는다
    alertBody: '지금 바로 대화하러 가요',
  },
  notificationChannelName: '기본 알림',
  login: {
    failed: '로그인 중 문제가 생겼어요.',
    cancelled: '로그인이 취소됐어요.',
    authCodeMissing: '인증 코드를 받지 못했어요.',
    idTokenMissing: 'id_token을 받지 못했어요.',
  },
  // 웹 토스트는 한 줄·2초라 문구는 20자 안팎, 할 일 하나만 담는다
  purchase: {
    notConfigured: '결제를 사용할 수 없는 빌드예요.',
    network: '네트워크 연결을 확인해 주세요',
    alreadySubscribed: '이미 구독 중이에요. 구매 복원을 눌러 주세요',
    otherAccount: '구독 중인 다른 계정으로 로그인해 주세요',
    notAvailable: '지금은 살 수 없는 상품이에요',
    packageMissing: '지금은 살 수 없는 상품이에요.',
    notAllowed: '이 기기에서는 결제할 수 없어요',
    pending: '승인 대기 중이에요. 승인되면 바로 열려요',
    failed: '문제가 생겼어요. 잠시 후 다시 시도해 주세요',
  },
  // 일요일부터
  weekdays: ['일', '월', '화', '수', '목', '금', '토'],
};

export type ShellMessages = typeof ko;

const ja: ShellMessages = {
  loadFailed: {
    title: '画面を読み込めませんでした',
    description: 'ネットワーク接続を確認して\nもう一度お試しください',
    retryButton: 'もう一度試す',
  },
  alarm: {
    goButton: '会話しに行く',
    stopButton: '止める',
    alertBody: '今すぐ会話しに行きましょう',
  },
  notificationChannelName: '基本の通知',
  login: {
    failed: 'ログイン中に問題が起きました。',
    cancelled: 'ログインがキャンセルされました。',
    authCodeMissing: '認証コードを受け取れませんでした。',
    idTokenMissing: 'id_tokenを受け取れませんでした。',
  },
  purchase: {
    notConfigured: '決済を使えないビルドです。',
    network: 'ネットワーク接続を確認してください',
    alreadySubscribed:
      'すでにサブスクリプション中です。購入を復元を押してください',
    otherAccount: 'サブスクリプション中の別アカウントでログインしてください',
    notAvailable: '現在購入できない商品です',
    packageMissing: '現在購入できない商品です。',
    notAllowed: 'この端末では決済できません',
    pending: '承認待ちです。承認されるとすぐ使えます',
    failed: '問題が起きました。しばらくしてからもう一度お試しください',
  },
  weekdays: ['日', '月', '火', '水', '木', '金', '土'],
};

export const SHELL_MESSAGES: Record<ShellLocale, ShellMessages> = { ko, ja };
