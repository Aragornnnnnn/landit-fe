// 그날 주고받은 말 다시 보기 — 상세와 같은 응답(캐시)을 이어 쓰되, 교정이 준비될 때까지는 다시 묻는다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { SmallTalkTranscript } from './_ui/SmallTalkTranscript';

export default function SmallTalkTranscriptPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  // 대화 종료 흐름에서 왔는지 — 그때만 표현 학습으로 이어지는 버튼이 선다 (routes.smallTalkTranscriptPath)
  searchParams: Promise<{ next?: string }>;
}) {
  const { sessionId } = use(params);
  const { next } = use(searchParams);
  const id = Number(sessionId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return (
    <SmallTalkTranscript
      sessionId={id}
      continueToLearning={next === 'learning'}
    />
  );
}
