// 작성 화면 헤더 오른쪽의 사진 추가 버튼 — 앱 안에선 셸 사진 보관함을, 브라우저에선 숨은 파일 입력을 연다
import { useRef } from 'react';

import { ImagePlusIcon } from '@/shared/ui/Icons';

import type { PhotoSource } from '../../model/shell-photos';

interface AttachPhotoButtonProps {
  source: Exclude<PhotoSource, 'unavailable'>;
  // 꽉 찼거나 보내는 중이면 회색으로 잠근다 — 몇 장 남았는지는 굳이 말하지 않는다
  disabled: boolean;
  // 브라우저 파일 입력으로 고른 파일
  onPickFiles: (files: File[]) => void;
  // 앱 안에서 누름 — 셸 보관함은 호출부가 연다
  onPickFromShell: () => void;
}

export const AttachPhotoButton = ({
  source,
  disabled,
  onPickFiles,
  onPickFromShell,
}: AttachPhotoButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          source === 'shell' ? onPickFromShell() : inputRef.current?.click()
        }
        aria-label="사진 추가"
        className="flex size-9 items-center justify-center rounded-full text-foreground transition-all active:scale-90 active:bg-secondary disabled:opacity-20 disabled:active:scale-100 disabled:active:bg-transparent"
      >
        <ImagePlusIcon size={24} />
      </button>
      {source === 'file-input' && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            onPickFiles(Array.from(event.target.files ?? []));
            // 같은 사진을 뺐다가 다시 고를 수 있게 비운다 — 안 비우면 change가 안 뜬다
            event.target.value = '';
          }}
        />
      )}
    </>
  );
};
