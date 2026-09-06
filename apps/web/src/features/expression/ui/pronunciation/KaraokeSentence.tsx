// 재생 진행률에 맞춰 글자가 순서대로 물드는 문장 — 온보딩 사운드 스텝과 같은 연출.
// 표현(highlight) 구간은 굵게, 물든 글자는 primary. 단어 단위로 줄바꿈한다
interface KaraokeSentenceProps {
  text: string;
  // 굵게 강조할 표현 구간
  highlight: string;
  // 재생 진행률 0~1. 0이면 전부 기본색
  progress: number;
}

export const KaraokeSentence = ({
  text,
  highlight,
  progress,
}: KaraokeSentenceProps) => {
  const litIndex = Math.floor(progress * text.length);
  const highlightStart = highlight ? text.indexOf(highlight) : -1;
  const highlightEnd =
    highlightStart >= 0 ? highlightStart + highlight.length : -1;

  const words = text.split(' ');
  // 단어별 전역 시작 인덱스 — 렌더 중 변수 재할당 없이 미리 계산한다 (React Compiler 제약)
  const wordStarts = words.reduce<number[]>((starts, _, index) => {
    starts.push(
      index === 0 ? 0 : starts[index - 1] + words[index - 1].length + 1,
    );
    return starts;
  }, []);

  return (
    <>
      {words.map((word, wordIndex) => {
        const start = wordStarts[wordIndex];
        return (
          <span key={wordIndex}>
            <span className="inline-block">
              {word.split('').map((char, charIndex) => {
                const globalIndex = start + charIndex;
                const bold =
                  globalIndex >= highlightStart && globalIndex < highlightEnd;
                return (
                  <span
                    key={charIndex}
                    className={`transition-colors duration-100 ${
                      bold ? 'font-extrabold' : ''
                    } ${globalIndex < litIndex ? 'text-primary' : ''}`}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
            {wordIndex < words.length - 1 && ' '}
          </span>
        );
      })}
    </>
  );
};
