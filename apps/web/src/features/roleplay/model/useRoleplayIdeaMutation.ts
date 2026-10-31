// 아이디어 추천받기 — 누를 때마다 새로 받는다. 캐시할 값이 아니라 뮤테이션으로 둔다
'use client';

import { useMutation } from '@tanstack/react-query';

import { getRoleplayIdea } from '../api/roleplay';

export const useRoleplayIdeaMutation = () =>
  useMutation({ mutationFn: () => getRoleplayIdea() });
