// 온보딩 3단계 — 마이크 권한 요청 (거부해도 다음 스텝으로 진행)
'use client';

import { Button } from '@/shared/ui/Button';

import { useMicPermission } from '../model/useMicPermission';
import { PermissionPreview } from './PermissionPreview';

export const MicStep = ({ onNext }: { onNext: () => void }) => {
  const { requesting, request } = useMicPermission();

  const handleAllow = async () => {
    await request();
    onNext();
  };

  return (
    <>
      <div className="flex flex-1 flex-col pt-7">
        <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
          다음으로 마이크를 켜서
          <br />
          제가 들을 수 있게 해주세요
        </h1>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-8">
          <PermissionPreview />
        </div>
      </div>

      <Button onClick={handleAllow} loading={requesting}>
        마이크 켤게요!
      </Button>
    </>
  );
};
