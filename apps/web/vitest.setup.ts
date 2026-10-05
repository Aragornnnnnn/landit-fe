// 모든 테스트에서 jest-dom 매처(toBeInTheDocument 등)를 쓸 수 있게 확장한다
import '@testing-library/jest-dom/vitest';

// 테스트에서 앰플리튜드 키가 실수로 주입돼도 실제 SDK 전송이 일어나지 않게 no-op 모드를 강제한다
process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY = '';
