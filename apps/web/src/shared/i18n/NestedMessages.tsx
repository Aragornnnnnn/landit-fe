'use client';

// 화면 layout의 문구 묶음을 바깥 묶음 위에 더하는 Provider — next-intl은 messages를 주면 바깥 것을 갈아 끼워서 직접 합친다
import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  type AbstractIntlMessages,
} from 'next-intl';

export const NestedMessages = ({
  messages,
  children,
}: {
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) => {
  const locale = useLocale();
  const parent = useMessages();
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ ...parent, ...messages }}
    >
      {children}
    </NextIntlClientProvider>
  );
};
