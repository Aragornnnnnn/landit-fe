// 다음 화면이 쓸 그림을 미리 받는다 — next/image가 만들 최적화 주소 그대로 preload해야 나중 <Image>가 캐시를 맞춘다
import { getImageProps, type ImageProps } from 'next/image';
import { preload } from 'react-dom';

/** <Image>에 그대로 펼칠 수 있는 최소 props — 미리 받는 곳과 그리는 곳이 같은 객체를 쓰면 주소가 어긋나지 않는다 */
export type PreloadableImage = Pick<ImageProps, 'src' | 'width' | 'height'> & {
  src: string;
};

export const preloadImages = (images: PreloadableImage[]) => {
  for (const image of images) {
    const { props } = getImageProps({ ...image, alt: '' });
    preload(props.src, {
      as: 'image',
      imageSrcSet: props.srcSet,
      imageSizes: props.sizes,
    });
  }
};
