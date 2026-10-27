// 화면이 쓰는 문구 묶음만 브라우저로 보내는 서버 컴포넌트 — 루트는 common만 놓고, 화면 layout은 바깥 묶음 위에 자기 묶음을 더한다
import { NextIntlClientProvider, type Messages } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { pickMessages } from './messages';
import { NestedMessages } from './NestedMessages';

/** 루트 layout 전용 — 바깥 Provider가 없어 common만 놓는다 */
export const RootMessagesProvider = async ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <NextIntlClientProvider messages={pickMessages(await getMessages(), [])}>
    {children}
  </NextIntlClientProvider>
);

/**
 * 화면 layout이 쓰는 묶음을 바깥 layout이 보낸 묶음 위에 더한다 — 하위 layout이 바깥 묶음을 다시 적지 않아도 된다.
 *
 * @param namespaces 그 화면의 클라이언트 컴포넌트가 쓰는 네임스페이스. 서버 컴포넌트(getTranslations)만 쓰는 묶음은 넣지 않는다
 */
export const MessagesProvider = async ({
  namespaces,
  children,
}: {
  namespaces: readonly (keyof Messages)[];
  children: React.ReactNode;
}) => (
  <NestedMessages messages={pickMessages(await getMessages(), namespaces)}>
    {children}
  </NestedMessages>
);
