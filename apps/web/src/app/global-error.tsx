'use client';

// 루트 레이아웃까지 죽었을 때의 최후 방어선 — 스타일 시트 없이도 그려지도록 인라인 스타일만 쓴다
import { useEffect } from 'react';

import { reportError } from '@/shared/monitoring/report';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: '0 auto',
          maxWidth: 430,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fbfbfa',
          fontFamily: 'Pretendard, sans-serif',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '0 32px',
            textAlign: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 레이아웃이 죽은 상태라 next/image를 못 믿는다 */}
          <img
            src="/images/character/landy-crying.webp"
            alt=""
            width={132}
            height={132}
          />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: '#1a1a1a',
              }}
            >
              문제가 생겼어요
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 15,
                lineHeight: '22px',
                color: '#8a8a86',
              }}
            >
              잠시 후 다시 시도해 주세요
            </p>
          </div>
        </div>
        <div
          style={{
            flex: 'none',
            padding: '12px 20px max(env(safe-area-inset-bottom), 24px)',
          }}
        >
          <button
            onClick={reset}
            style={{
              width: '100%',
              height: 56,
              border: 'none',
              borderRadius: 12,
              backgroundColor: '#e07a3a',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            다시 시도할게요
          </button>
        </div>
      </body>
    </html>
  );
}
