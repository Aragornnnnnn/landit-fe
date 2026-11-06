'use client';

// 셸 안 이동 — 첫 로드는 인라인 스크립트가 맡고, 클라이언트 이동으로 온 경우는 React가 그 스크립트를 실행하지 않아 여기서 보낸다
import { useEffect } from 'react';

import { SCENARIO_PATH } from '@/shared/lib/routes';

import {
  redirectShellToHome,
  shellRedirectScript,
} from '../_model/shell-redirect';

export const ShellRedirect = () => {
  useEffect(() => {
    redirectShellToHome(SCENARIO_PATH);
  }, []);

  return <script dangerouslySetInnerHTML={{ __html: shellRedirectScript }} />;
};
