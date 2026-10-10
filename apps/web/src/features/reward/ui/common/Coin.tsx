// 환급 동전 그림 — 크기가 달라도 같은 파일 하나를 쓴다
import Image from 'next/image';

import coinImage from '../../assets/coin.png';

export const Coin = ({
  size,
  className,
}: {
  size: number;
  className?: string;
}) => (
  <Image
    src={coinImage}
    alt=""
    width={size}
    height={size}
    // 크기마다 변환본을 따로 받으면 연출이 붙는 순간 큰 동전이 빈 채로 튄다 — 헤더가 이미 받아 둔 원본을 같이 쓴다
    unoptimized
    className={className}
  />
);
