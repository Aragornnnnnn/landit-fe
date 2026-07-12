// 온보딩 도메인 타입
import { STEP_ORDER } from './onboarding.constants';

export type OnboardingStep = (typeof STEP_ORDER)[number];
