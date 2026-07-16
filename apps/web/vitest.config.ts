import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // 목·스파이를 테스트마다 자동 리셋 — 한 테스트의 목 상태가 다음 테스트로 새지 않게 (docs/testing.md)
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      // hoisted 모노레포라 react 복사본이 여러 벌이다(루트 19.2.3, web 19.2.4, 테스트 렌더러 밑 19.2.4).
      // 렌더러(@testing-library/react)는 Node 해석으로 자기 밑 복사본을 쓰는데, 소스가 다른 복사본을
      // 잡으면 훅 dispatcher가 null이 된다 — 소스도 렌더러와 같은 복사본을 보게 강제
      react: new URL(
        '../../node_modules/@testing-library/react/node_modules/react',
        import.meta.url,
      ).pathname,
      'react-dom': new URL(
        '../../node_modules/@testing-library/react/node_modules/react-dom',
        import.meta.url,
      ).pathname,
    },
  },
});
