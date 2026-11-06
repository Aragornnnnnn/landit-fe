// 랜딩 제목 문구의 태그를 컴포넌트로 바꾸는 짝 — 줄바꿈, 모바일에서만 바꾸는 줄, 손으로 그은 강조
import { Underline, type Mark } from './Underline';

/**
 * t.rich에 넘길 태그 짝. `<br></br>`은 줄바꿈, `<mobileBreak></mobileBreak>`는 모바일에서만 줄바꿈, `<mark>`는 강조 표시다.
 *
 * @param mark 그 제목에 쓸 강조 모양. 안 주면 붓질
 */
export const titleTags = (mark?: Mark) => ({
  br: () => <br />,
  mobileBreak: () => <br className="sm:hidden" />,
  mark: (chunks: React.ReactNode) => (
    <Underline mark={mark}>{chunks}</Underline>
  ),
});
