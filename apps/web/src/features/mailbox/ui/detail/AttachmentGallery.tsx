'use client';

// 보낸 피드백에 붙인 사진 줄 — 3칸 균등 정사각. 장마다 따로 받아 한 장이 실패해도 나머지는 보이고,
// 누르면 불러온 사진끼리 넘겨 보는 확대 보기를 그 사진부터 연다
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { RefreshIcon } from '@/shared/ui/Icons';

import type { FeedbackAttachment } from '../../api/mailbox';
import { useAttachmentImagesQuery } from '../../model/useAttachmentImagesQuery';
import { ImageViewer, type ViewerImage } from '../viewer/ImageViewer';

export const AttachmentGallery = ({
  attachments,
}: {
  attachments: FeedbackAttachment[];
}) => {
  const t = useTranslations('mailbox.attachmentGallery');
  const images = useAttachmentImagesQuery(attachments);
  // 확대 보기엔 불러온 사진만 넣는다 — 실패한 칸은 넘기기에서 빠진다
  const loaded: ViewerImage[] = images.flatMap((image, index) =>
    image.status === 'success'
      ? [{ src: image.src, alt: t('photoLabel', { order: index + 1 }) }]
      : [],
  );
  // 열 때의 목록을 붙잡아 둔다 — 연 뒤 앞 사진이 도착해 목록이 늘어도 누른 사진이 그대로 보이게
  const [opened, setOpened] = useState<{
    images: ViewerImage[];
    index: number;
  } | null>(null);

  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <li
            key={attachments[index].attachmentId}
            className="aspect-square overflow-hidden rounded-lg bg-secondary"
          >
            {image.status === 'pending' && (
              <div role="status" className="size-full animate-pulse">
                <span className="sr-only">
                  {t('loadingLabel', { order: index + 1 })}
                </span>
              </div>
            )}
            {image.status === 'error' && (
              <button
                type="button"
                onClick={image.retry}
                aria-label={t('retryLabel', { order: index + 1 })}
                className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground active:opacity-70"
              >
                <RefreshIcon size={20} />
                <span className="text-11">{t('retryButton')}</span>
              </button>
            )}
            {image.status === 'success' && (
              <button
                type="button"
                onClick={() =>
                  setOpened({
                    images: loaded,
                    index: loaded.findIndex(({ src }) => src === image.src),
                  })
                }
                aria-label={t('zoomLabel', { order: index + 1 })}
                className="size-full active:opacity-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 인증이 필요한 사진이라 받은 바이트의 blob 주소를 쓴다 */}
                <img
                  src={image.src}
                  alt=""
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
            )}
          </li>
        ))}
      </ul>
      {opened && (
        <ImageViewer
          images={opened.images}
          startIndex={opened.index}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
};
