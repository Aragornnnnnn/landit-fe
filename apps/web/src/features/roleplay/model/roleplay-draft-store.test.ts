// @vitest-environment jsdom
// 시나리오 초안 보관 — 맡긴 계정에게만 되돌려 주는지 검증
import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearRoleplayDraft,
  readRoleplayDraft,
  saveRoleplayDraft,
} from './roleplay-draft-store';

const draft = { myRole: '손님', partnerRole: '직원', situation: '주문하기' };

beforeEach(() => clearRoleplayDraft());

describe('roleplay-draft-store', () => {
  it('맡긴 계정이 읽으면 초안을 돌려준다', () => {
    saveRoleplayDraft(draft, 59);

    expect(readRoleplayDraft(59)).toEqual(draft);
  });

  it('다른 계정이 읽으면 초안을 주지 않는다', () => {
    saveRoleplayDraft(draft, 59);

    expect(readRoleplayDraft(60)).toBeNull();
  });
});
