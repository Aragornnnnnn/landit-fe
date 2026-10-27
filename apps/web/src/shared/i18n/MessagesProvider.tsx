// 화면이 쓰는 문구 묶음만 브라우저로 보내는 서버 컴포넌트 — 루트는 common만, 화면 layout은 자기 묶음을 더해 감싼다
import { NextIntlClientProvider, type Messages } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { pickMessages } from './messages';

interface MessagesProviderProps {
  // 그 화면의 클라이언트 컴포넌트가 쓰는 네임스페이스 — 서버 컴포넌트(getTranslations)만 쓰는 묶음은 넣지 않는다
  namespaces?: readonly (keyof Messages)[];
  children: React.ReactNode;
}

export const MessagesProvider = async ({
  namespaces = [],
  children,
}: MessagesProviderProps) => (
  <NextIntlClientProvider
    messages={pickMessages(await getMessages(), namespaces)}
  >
    {children}
  </NextIntlClientProvider>
);
