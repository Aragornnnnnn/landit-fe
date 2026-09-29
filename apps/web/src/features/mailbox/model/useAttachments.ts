// 작성 중인 피드백의 첨부 사진 — 브라우저 파일은 JPEG로 다시 구워, 셸 보관함 사진은 그대로 담는다. 넘치거나 못 읽으면 토스트로 알린다
import { useEffect, useRef, useState } from 'react';

import { reportWarning } from '@/shared/monitoring/report';
import { showToast } from '@/shared/ui/toast';

import { toJpeg } from '../lib/jpeg-image';
import { MAX_ATTACHMENTS, takeAttachable } from './attachment';
import { pickPhotosViaBridge, toPickedFile } from './shell-photos';

export interface Attachment {
  id: string;
  file: File;
  // 썸네일에 쓰는 blob 주소 — 빼거나 화면을 떠나면 돌려준다
  previewUrl: string;
}

export const useAttachments = () => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // 굽는 동안엔 사진 추가와 보내기를 막는다 — 안 막으면 사진 없이 전송되거나 개수 계산이 옛 값으로 된다
  const [isAttaching, setIsAttaching] = useState(false);
  // 만든 미리보기 주소 전부 — 화면을 떠날 때 한꺼번에 돌려준다
  const previewUrls = useRef(new Set<string>());
  const nextId = useRef(0);
  const isMounted = useRef(false);
  // 화면을 떠나면 셸 회신 기다리기를 끊는다 — 안 끊으면 구독이 제한 시간까지 남는다
  const leave = useRef<AbortController | null>(null);

  useEffect(() => {
    isMounted.current = true;
    const urls = previewUrls.current;
    // 마운트마다 새로 만든다 — 개발 모드의 마운트·해제·재마운트에서 끊긴 것을 다시 쓰지 않게
    const controller = new AbortController();
    leave.current = controller;
    return () => {
      isMounted.current = false;
      controller.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const add = (files: File[]) => {
    const added = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      return { id: String(nextId.current++), file, previewUrl };
    });
    setAttachments((current) => [...current, ...added]);
  };

  const attach = async (picked: File[]) => {
    const { taken, overflowed } = takeAttachable(attachments.length, picked);
    if (overflowed) showToast(`사진은 ${MAX_ATTACHMENTS}장까지 보낼 수 있어요`);
    if (taken.length === 0) return;

    setIsAttaching(true);
    const converted: File[] = [];
    // 한 장씩 굽는다 — 큰 사진 여러 장을 한꺼번에 풀면 iOS 웹뷰가 메모리 한도에 걸려 죽는다
    for (const file of taken) {
      try {
        converted.push(await toJpeg(file));
      } catch (error) {
        reportWarning(error, { type: file.type, size: file.size });
      }
    }
    // 굽는 사이 화면을 떠났으면 담지 않는다 — 여기서 만든 주소는 돌려줄 곳이 없다
    if (!isMounted.current) return;
    // 못 읽은 사진만 빼고 나머지는 담는다 — 한 장 때문에 전부 다시 고르게 하지 않는다
    if (converted.length < taken.length) {
      showToast('불러올 수 없는 사진은 빼고 담았어요');
    }

    add(converted);
    setIsAttaching(false);
  };

  // 셸의 사진 보관함에서 남은 칸만큼 받는다 — 셸이 이미 줄인 JPEG를 주고, 장수도 셸 선택창이 막는다
  const attachFromShell = async () => {
    setIsAttaching(true);
    const reply = await pickPhotosViaBridge(
      MAX_ATTACHMENTS - attachments.length,
      leave.current?.signal,
    );
    if (!isMounted.current) return;
    // 토스트는 한 번에 하나만 보이니 가장 중요한 것 하나만 말한다 — 전부 실패 > 일부 실패 > 넘침
    if (reply?.status === 'error') {
      showToast('사진을 불러오지 못했어요');
    } else if (reply && reply.failedCount > 0) {
      showToast('불러올 수 없는 사진은 빼고 담았어요');
    } else if (reply?.overflowed) {
      showToast(`사진은 ${MAX_ATTACHMENTS}장까지 보낼 수 있어요`);
    }
    if (reply?.status === 'success') add(reply.photos.map(toPickedFile));
    setIsAttaching(false);
  };

  const detach = (id: string) => {
    const target = attachments.find((item) => item.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
      previewUrls.current.delete(target.previewUrl);
    }
    setAttachments((current) => current.filter((item) => item.id !== id));
  };

  return {
    attachments,
    isAttaching,
    isFull: attachments.length >= MAX_ATTACHMENTS,
    attach,
    attachFromShell,
    detach,
  };
};
