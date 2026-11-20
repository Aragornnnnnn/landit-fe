// 백엔드 요청 경로를 백엔드 주소로 바꾼다 — Vercel을 거치지 않고 브라우저가 백엔드를 바로 부르게 한다
export const backendUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}${path}`;
