// 문구 안의 태그를 컴포넌트로 바꾸는 공용 짝 — 줄바꿈처럼 여러 화면이 똑같이 쓰는 것만 둔다

/** 문구의 `<br></br>`을 줄바꿈으로 — t.rich('key', lineBreak) */
export const lineBreak = { br: () => <br /> };
