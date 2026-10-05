// 모든 테스트에서 jest-dom 매처(toBeInTheDocument 등)를 쓸 수 있게 확장한다
import '@testing-library/jest-dom/vitest';

// 테스트에서 앰플리튜드 키가 실수로 주입돼도 실제 SDK 전송이 일어나지 않게 no-op 모드를 강제한다
process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY = '';

// jsdom엔 ResizeObserver가 없다 — 크기를 재는 컴포넌트가 마운트만 되도록 아무것도 하지 않는 대역을 둔다
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
