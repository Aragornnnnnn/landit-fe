// 로그인 화면 언어 버튼 — 기기에 한국어·일본어가 없을 때만 보이고, 고르면 그 언어로 다시 그리는지 검증한다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LanguagePicker } from './LanguagePicker';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

// 지금 화면 언어 — 기본 한국어, 테스트마다 바꿀 수 있다
const screenLocale = vi.hoisted(() => ({ value: 'ko' }));
vi.mock('next-intl', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next-intl')>()),
  useLocale: () => screenLocale.value,
}));

const renderPicker = () => render(<LanguagePicker />);

const deviceLanguages = (languages: string[]) =>
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);

beforeEach(() => {
  screenLocale.value = 'ko';
  document.cookie = 'landit-locale=; max-age=0; path=/';
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('LanguagePicker', () => {
  it('기기에 한국어나 일본어가 있으면 보이지 않는다', () => {
    deviceLanguages(['en-US', 'ja-JP']);

    const { container } = renderPicker();

    expect(container).toBeEmptyDOMElement();
  });

  it('둘 다 없는 기기에선 지금 화면 언어를 적은 버튼이 보이고, 누르면 두 언어가 펼쳐진다', () => {
    deviceLanguages(['en-US']);
    renderPicker();

    fireEvent.click(screen.getByRole('button', { name: /Language/ }));

    expect(screen.getByRole('button', { name: '한국어' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '日本語' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('다른 언어를 고르면 쿠키에 담고 그 언어로 다시 그린다', () => {
    deviceLanguages(['en-US']);
    renderPicker();

    fireEvent.click(screen.getByRole('button', { name: /Language/ }));
    fireEvent.click(screen.getByRole('button', { name: '日本語' }));

    expect(document.cookie).toContain('landit-locale=ja');
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('지금 언어를 다시 고르면 다시 그리지 않고 닫기만 한다', () => {
    deviceLanguages(['en-US']);
    renderPicker();

    fireEvent.click(screen.getByRole('button', { name: /Language/ }));
    fireEvent.click(screen.getByRole('button', { name: '한국어' }));

    expect(refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('바깥을 누르면 닫힌다', () => {
    deviceLanguages(['en-US']);
    renderPicker();

    fireEvent.click(screen.getByRole('button', { name: /Language/ }));
    fireEvent.click(screen.getByTestId('language-picker-backdrop'));

    expect(screen.queryByRole('list')).toBeNull();
  });

  it('Escape를 누르면 닫히고 포커스가 언어 버튼으로 돌아간다', () => {
    deviceLanguages(['en-US']);
    renderPicker();
    const toggle = screen.getByRole('button', { name: /Language/ });

    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: 'Escape' });

    expect(screen.queryByRole('list')).toBeNull();
    expect(toggle).toHaveFocus();
  });

  it('지금 화면이 일본어면 버튼에 日本語가 적히고 日本語가 골라져 있다', () => {
    screenLocale.value = 'ja';
    deviceLanguages(['en-US']);
    renderPicker();

    const toggle = screen.getByRole('button', { name: /Language/ });
    expect(toggle).toHaveTextContent('日本語');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: '日本語' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
