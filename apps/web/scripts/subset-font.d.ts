// subset-font는 타입을 싣지 않아 랜딩 폰트 생성기가 쓰는 부분만 적어 둔다
declare module 'subset-font' {
  const subsetFont: (
    font: Buffer,
    text: string,
    options?: { targetFormat?: 'sfnt' | 'woff' | 'woff2' },
  ) => Promise<Buffer>;
  export default subsetFont;
}
