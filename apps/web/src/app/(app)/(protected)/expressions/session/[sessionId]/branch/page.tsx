// 스몰톡 대화 직후 라우트 — 표현의 출처가 그 대화(세션)라 주소에도 세션이 선다
import { use } from 'react';

import { SmallTalkResult } from './_ui/SmallTalkResult';

export default function SmallTalkResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  // 대화를 막 끝내고 왔는지 — 표현 학습에서 돌아올 때는 축하 없이 리스트만 편다
  searchParams: Promise<{ celebrate?: string }>;
}) {
  const { sessionId } = use(params);
  const { celebrate } = use(searchParams);

  return (
    <SmallTalkResult
      sessionId={Number(sessionId)}
      celebrating={celebrate === '1'}
    />
  );
}
