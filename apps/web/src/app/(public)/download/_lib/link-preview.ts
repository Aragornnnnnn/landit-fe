// /download 링크 미리보기 — 메신저의 미리보기 봇에게 스토어 페이지 대신 랜딧 카드(OG)를 준다
const TITLE = '랜딧(Landit): 영어회화·스픽·스피킹·표현·리스닝 앱';
// App Store 부제와 같은 문장
const DESCRIPTION = '원어민과 대화하며 내 영어가 어떻게 들리는지 확인해요';
const IMAGE_PATH = '/og/share.jpg';

// 링크를 붙여 넣으면 미리보기를 만들러 오는 봇들. iMessage·라인 미리보기는 facebookexternalhit를 단다.
// 인앱 브라우저로 연 사람(KAKAOTALK, Line/)은 봇이 아니다 — 스크랩 봇 이름만 적는다
const LINK_PREVIEW_BOT =
  /kakaotalk-scrap|facebookexternalhit|Twitterbot|Slackbot|Discordbot|TelegramBot|WhatsApp|LinkedInBot/i;

export const isLinkPreviewBot = (userAgent: string) =>
  LINK_PREVIEW_BOT.test(userAgent);

// 봇은 메타만 읽는다. 사람에게는 보여 줄 일이 없어 본문은 비워 둔다
export const buildLinkPreviewHtml = (origin: string) => {
  const image = `${origin}${IMAGE_PATH}`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${TITLE}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="랜딧">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
</head>
<body></body>
</html>`;
};
