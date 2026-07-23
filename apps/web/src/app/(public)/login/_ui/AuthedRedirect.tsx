'use client';

// 서버 컴포넌트인 page에 로그인 가드 훅을 꽂기 위한 마운트 껍데기 (화면은 그리지 않는다)
import { useAuthedRedirect } from '../_model/useAuthedRedirect';

export const AuthedRedirect = () => {
  useAuthedRedirect();
  return null;
};
