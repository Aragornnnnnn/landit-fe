// 입력창 아래 첨부 사진 줄 — 72px 썸네일, 오른쪽 위 ×로 뺀다
import { CloseIcon } from '@/shared/ui/Icons';

import type { Attachment } from '../../model/useAttachments';

interface AttachmentThumbnailsProps {
  attachments: Attachment[];
  // 보내는 중엔 ×를 숨겨 보내는 사진이 바뀌지 않게 한다
  locked: boolean;
  onDetach: (id: string) => void;
}

export const AttachmentThumbnails = ({
  attachments,
  locked,
  onDetach,
}: AttachmentThumbnailsProps) => {
  if (attachments.length === 0) return null;

  return (
    <ul className="mt-3 flex shrink-0 gap-2">
      {attachments.map(({ id, previewUrl }, index) => (
        <li
          key={id}
          className={`relative size-[72px] overflow-hidden rounded-lg bg-secondary ${locked ? 'opacity-60' : ''}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- blob 미리보기라 next/image 최적화가 필요 없다 */}
          <img
            src={previewUrl}
            alt={`첨부 사진 ${index + 1}`}
            decoding="async"
            className="size-full object-cover"
          />
          {!locked && (
            <button
              type="button"
              onClick={() => onDetach(id)}
              aria-label={`첨부 사진 ${index + 1} 빼기`}
              className="absolute top-1 right-1 flex size-[22px] items-center justify-center rounded-full bg-foreground/60 text-background active:scale-90"
            >
              <CloseIcon size={12} strokeWidth={2.5} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};
