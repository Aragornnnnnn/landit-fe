// 강제 업데이트 모달 — 닫을 수 없고, 스토어로 이동하는 버튼만 제공한다
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

import { goToStore } from '../../model/goToStore';

interface ForceUpdateModalProps {
  reason: string | null;
}

const DEFAULT_REASON = '새로운 기능을 사용하려면 업데이트가 꼭 필요해요';

export const ForceUpdateModal = ({ reason }: ForceUpdateModalProps) => (
  <Modal open onClose={() => {}} dismissible={false} label="Landit 새 버전 출시!">
    <div className="flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/character/landy-fighting.webp"
        alt="랜디"
        className="object-contain"
        style={{ width: 120, height: 120 }}
      />
      <h2 className="mt-4 text-lg font-bold text-foreground">
        Landit 새 버전 출시!
      </h2>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {reason?.trim() || DEFAULT_REASON}
      </p>
    </div>
    <Button className="mt-5" onClick={goToStore}>
      업데이트하러 가기
    </Button>
  </Modal>
);
