// 로그인 라우트 — 이미 로그인돼 있으면 홈으로 보내는 가드만 얹고 화면은 LoginScreen이 그린다
import { LoginScreen } from '../_ui/LoginScreen';
import { AuthedRedirect } from './_ui/AuthedRedirect';

const LoginPage = () => (
  <LoginScreen>
    <AuthedRedirect />
  </LoginScreen>
);

export default LoginPage;
