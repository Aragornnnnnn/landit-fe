'use client';

// 누르면 그 한 장을 확대 보기로 여는 편지 이미지 — 받은 편지의 이미지 블록과 마크다운 본문 이미지가 같이 쓴다.
// img를 버튼으로 감싸지 않는다 — 마크다운 스타일이 `p > img:only-child`처럼 img 자체를 겨냥해 모양이 깨진다
import { useState, type ImgHTMLAttributes } from 'react';

import { ImageViewer } from './ImageViewer';

type ZoomableImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'onClick'
> & { src: string };

export const ZoomableImage = ({
  src,
  alt = '',
  className = '',
  ...rest
}: ZoomableImageProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- 편지 이미지 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다 */}
      <img
        {...rest}
        src={src}
        alt={alt}
        role="button"
        tabIndex={0}
        aria-label={alt ? `${alt} 크게 보기` : '사진 크게 보기'}
        onClick={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`cursor-zoom-in ${className}`}
      />
      {isOpen && (
        <ImageViewer
          images={[{ src, alt }]}
          startIndex={0}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
