// next-intl 타입 연결 — 언어 값과 문구 키를 타입으로 묶어, 없는 키를 쓰면 컴파일 에러가 나게 한다
import type { Locale } from './locale';
import type ko from './locales/ko';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof ko;
  }
}
