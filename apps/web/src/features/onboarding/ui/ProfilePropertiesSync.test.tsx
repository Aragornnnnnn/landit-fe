// ProfilePropertiesSync — 학습 수준·배울 영어를 언제 프로필에 올리는지의 계약 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setUserProperties } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';

import { useAccentQuery } from '../model/useAccentQuery';
import { useLearningLevelQuery } from '../model/useLearningLevelQuery';
import { ProfilePropertiesSync } from './ProfilePropertiesSync';

vi.mock('@/shared/analytics', () => ({ setUserProperties: vi.fn() }));
const setUserPropertiesMock = vi.mocked(setUserProperties);

vi.mock('../model/useAccentQuery');
const useAccentQueryMock = vi.mocked(useAccentQuery);

vi.mock('../model/useLearningLevelQuery');
const useLearningLevelQueryMock = vi.mocked(useLearningLevelQuery);

const login = () =>
  useAuthStore.setState({
    accessToken: 'access',
    refreshToken: 'refresh',
    member: { userId: 42, nickname: null, email: null, provider: 'KAKAO' },
  });

const arrange = ({
  level,
  accent,
}: {
  level?: number | null;
  accent?: 'EN_US' | 'EN_GB' | null;
} = {}) => {
  useLearningLevelQueryMock.mockReturnValue({
    data: level === undefined ? undefined : { learningLevel: level },
  } as never);
  useAccentQueryMock.mockReturnValue({
    data:
      accent === undefined ? undefined : { accentLocale: accent, name: null },
  } as never);
  render(<ProfilePropertiesSync />);
};

afterEach(() => {
  cleanup();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    member: null,
  });
});

describe('ProfilePropertiesSync', () => {
  it('로그인 전에는 아무것도 올리지 않는다', () => {
    arrange({ level: 3, accent: 'EN_US' });

    expect(setUserPropertiesMock).not.toHaveBeenCalled();
  });

  it('도착한 값부터 올린다 — 한쪽 조회가 실패해도 다른 쪽이 묶여 빠지지 않게', () => {
    login();
    arrange({ level: 3 });

    expect(setUserPropertiesMock).toHaveBeenCalledExactlyOnceWith({
      learning_level: 3,
    });
  });

  it('둘 다 도착하면 각각 올라간다', () => {
    login();
    arrange({ level: 3, accent: 'EN_GB' });

    expect(setUserPropertiesMock).toHaveBeenCalledWith({ learning_level: 3 });
    expect(setUserPropertiesMock).toHaveBeenCalledWith({
      accent_locale: 'EN_GB',
    });
  });

  it('아직 안 고른 사람은 빈 값으로 올린다 — 지난 계정의 값이 남지 않게', () => {
    login();
    arrange({ level: null, accent: null });

    expect(setUserPropertiesMock).toHaveBeenCalledWith({
      learning_level: null,
    });
    expect(setUserPropertiesMock).toHaveBeenCalledWith({ accent_locale: null });
  });

  it('선택지 밖의 수준은 없는 것으로 본다', () => {
    login();
    arrange({ level: 9 });

    expect(setUserPropertiesMock).toHaveBeenCalledWith({
      learning_level: null,
    });
  });
});
