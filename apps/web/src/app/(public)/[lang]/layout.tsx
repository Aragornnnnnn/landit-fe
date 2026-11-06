// 랜딩 언어 구간 — /ko·/ja 두 주소만 만들고, 화면의 클라이언트 부품(시나리오 벽)이 쓸 landing 문구를 보낸다
import { LOCALES } from '@/shared/i18n/locale';
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

// 지원 언어가 아닌 첫 칸(/en, /foo)은 404다
export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

const LandingLocaleLayout = ({ children }: { children: React.ReactNode }) => (
  <MessagesProvider namespaces={['landing']}>{children}</MessagesProvider>
);

export default LandingLocaleLayout;
