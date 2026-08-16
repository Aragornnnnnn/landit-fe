// 공지·업데이트 본문 렌더러 — 마크다운 대신 블록 배열이라 타입별 단순 분기로 끝난다
import type { LetterBlock } from '../../api/letter-detail';

export const LetterBlocks = ({ blocks }: { blocks: LetterBlock[] }) => (
  <div className="flex flex-col gap-5">
    {blocks.map((block, index) => (
      // 블록엔 식별자가 없다 — 순서가 곧 정체성이고 목록이 재정렬되지 않는다
      <Block key={index} block={block} />
    ))}
  </div>
);

const Block = ({ block }: { block: LetterBlock }) => {
  if (block.type === 'PARAGRAPH') {
    return (
      <p className="text-[15px] leading-relaxed whitespace-pre-line text-foreground">
        {block.text}
      </p>
    );
  }

  if (block.type === 'ORDERED_LIST') {
    return (
      <ol className="flex flex-col gap-4">
        {block.items.map((item, index) => (
          <li key={index} className="flex gap-2.5">
            <span className="shrink-0 text-[15px] font-bold text-foreground">
              {index + 1}.
            </span>
            <span className="text-[15px] leading-relaxed text-foreground">
              {item}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return <LetterImage url={block.url} caption={block.caption} />;
};

// 이미지가 아직 없는 편지는 자리만 잡는다 — 시안의 illustration 자리와 같은 크기라
// 그림이 붙는 순간에도 글의 위치가 흔들리지 않는다
const LetterImage = ({ url, caption }: { url: string; caption?: string }) =>
  url ? (
    // eslint-disable-next-line @next/next/no-img-element -- 편지 이미지 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다 (시나리오 썸네일과 같은 사정)
    <img
      src={url}
      alt={caption ?? ''}
      className="w-full rounded-2xl object-cover"
    />
  ) : (
    <div className="flex aspect-[346/200] items-end rounded-2xl bg-secondary p-4">
      <span className="text-xs text-muted-foreground">{caption}</span>
    </div>
  );
