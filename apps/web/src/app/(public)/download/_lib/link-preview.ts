// /download 링크 미리보기 — 메신저의 미리보기 봇에게 스토어 페이지 대신 랜딧 카드(OG)를 준다. 카드는 보내는 사람의 화면 언어로 그린다
import type { Locale } from '@/shared/i18n/locale';

// 한국어 설명은 App Store 부제와 같은 문장
const CARD: Record<
  Locale,
  { siteName: string; title: string; description: string; imagePath: string }
> = {
  ko: {
    siteName: '랜딧',
    title: '랜딧(Landit): 영어회화·스픽·스피킹·표현·리스닝 앱',
    description: '원어민과 대화하며 내 영어가 어떻게 들리는지 확인해요',
    imagePath: '/og/share.jpg',
  },
  ja: {
    siteName: 'Landit',
    title: 'Landit: 英会話・スピーキング・フレーズ・リスニングアプリ',
    description: 'ネイティブと話して、自分の英語がどう聞こえるか確かめよう',
    imagePath: '/og/share-ja.jpg',
  },
};

// 링크를 붙여 넣으면 미리보기를 만들러 오는 봇들. iMessage·라인 미리보기는 facebookexternalhit를 단다.
// 인앱 브라우저로 연 사람(KAKAOTALK, Line/)은 봇이 아니다 — 스크랩 봇 이름만 적는다
const LINK_PREVIEW_BOT =
  /kakaotalk-scrap|facebookexternalhit|Twitterbot|Slackbot|Discordbot|TelegramBot|WhatsApp|LinkedInBot/i;

export const isLinkPreviewBot = (userAgent: string) =>
  LINK_PREVIEW_BOT.test(userAgent);

// 봇은 메타만 읽는다. 사람에게는 보여 줄 일이 없어 본문은 비워 둔다
export const buildLinkPreviewHtml = (origin: string, locale: Locale) => {
  const card = CARD[locale];
  const image = `${origin}${card.imagePath}`;
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>${card.title}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="${card.siteName}">
<meta property="og:title" content="${card.title}">
<meta property="og:description" content="${card.description}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
</head>
<body></body>
</html>`;
};
