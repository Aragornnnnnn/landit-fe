'use client';

// 고치기 첫 안내를 띄울지 정하는 훅 — 처음 만난 확인 화면에서만 띄운다.
// 띄우는 순간 본 것으로 기록한다 — 떠 있는 채로 화면을 떠나도(나가기·앱 종료) 다음에 또 뜨지 않게.
// 지금 화면에선 열 때 값으로 계속 보이고, 한 번 사라지면(보내기·다시 말하기·수정) 이 화면에서도 다시 안 뜬다
import { useEffect, useState } from 'react';

import { editHintSeen } from './edit-hint-seen';

export const useEditHint = (active: boolean) => {
  const [unseenOnOpen] = useState(() => !editHintSeen.has());
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(false);
  const visible = active && unseenOnOpen && !done;
  if (visible && !shown) setShown(true);
  if (!visible && shown && !done) setDone(true);

  useEffect(() => {
    if (visible) editHintSeen.mark();
  }, [visible]);

  return visible;
};
