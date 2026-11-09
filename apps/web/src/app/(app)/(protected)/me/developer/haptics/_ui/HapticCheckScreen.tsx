'use client';

// 햅틱 점검 화면(ADMIN) — 진동 여섯 가지를 눌러서 느껴 보고, 리듬은 실제 화면으로 띄워 보고, 화면별로 어느 순간에 어떤 진동이 오는지 줄을 눌러 미리 느껴 본다
import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { useIsAdmin } from '@/shared/auth/current-member';
import {
  haptic,
  HAPTIC_KINDS,
  HAPTIC_RHYTHM_NAMES,
  hapticRhythm,
  isHapticsEnabled,
  subscribeHapticsSetting,
  type HapticRhythm,
} from '@/shared/haptics';
import { backToMyPage } from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';

import {
  HAPTIC_SPOTS,
  KIND_GUIDE,
  RHYTHM_GUIDE,
  type HapticMoment,
} from '../_model/haptic-check-guide';
import { MenuSection, ROW_CLASS, ROW_STYLE } from '../../../_ui/Menu';
import { RhythmPreview } from './RhythmPreview';

// 순간 하나의 진동을 울리고 이름표를 고른다 — 리듬이면 진한 이름표로 큰 순간임을 드러낸다
const playMoment = (m: HapticMoment) =>
  'rhythm' in m ? hapticRhythm(m.rhythm) : haptic(m.kind);

const MomentBadge = ({ moment }: { moment: HapticMoment }) =>
  'rhythm' in moment ? (
    <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-12 font-bold text-primary-foreground">
      {RHYTHM_GUIDE[moment.rhythm].label}
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-12 font-bold text-foreground">
      {KIND_GUIDE[moment.kind].label}
    </span>
  );

// 진동 여섯 가지 — 누르면 그 진동만 온다 (누름 진동이 겹치지 않게 전역 진동에서 뺀다)
const KindGrid = () => (
  <section>
    <h2 className="mb-2 ml-1.5 text-12 font-medium text-muted-foreground">
      진동 6가지 — 눌러서 느껴 보세요
    </h2>
    <div className="grid grid-cols-2 gap-2">
      {HAPTIC_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          data-no-haptic
          onClick={() => haptic(kind)}
          className="flex flex-col items-start rounded-xl bg-card px-4 py-3.5 text-left active:bg-gray-50"
        >
          <span className="text-16 font-bold text-foreground">
            {KIND_GUIDE[kind].label}
          </span>
          <span className="mt-0.5 text-12 text-muted-foreground">
            {KIND_GUIDE[kind].when}
          </span>
        </button>
      ))}
    </div>
  </section>
);

// 리듬 카드 — 누르면 그 리듬을 쓰는 실제 화면이 떠서 연출과 진동을 같이 본다
const RhythmDemos = ({
  onOpen,
}: {
  onOpen: (rhythm: HapticRhythm) => void;
}) => (
  <MenuSection title="큰 순간의 리듬 — 누르면 실제 화면으로 보여 줘요">
    {HAPTIC_RHYTHM_NAMES.map((name) => (
      <button
        key={name}
        type="button"
        data-no-haptic
        onClick={() => onOpen(name)}
        className={ROW_CLASS}
        style={ROW_STYLE}
      >
        <span className="flex flex-1 flex-col py-3 text-left">
          <span className="text-15 font-bold text-foreground">
            {RHYTHM_GUIDE[name].label}
          </span>
          <span className="mt-0.5 text-12 text-muted-foreground">
            {RHYTHM_GUIDE[name].use}
          </span>
        </span>
      </button>
    ))}
  </MenuSection>
);

// 화면별로 진동이 오는 순간 — 줄을 누르면 그 순간의 진동이 온다
const SpotList = () => (
  <>
    {HAPTIC_SPOTS.map(({ screen, moments }) => (
      <MenuSection key={screen} title={screen}>
        {moments.map((m) => (
          <button
            key={m.moment}
            type="button"
            data-no-haptic
            onClick={() => playMoment(m)}
            className={ROW_CLASS}
            style={ROW_STYLE}
          >
            <span className="flex-1 py-3 text-left text-15 text-foreground">
              {m.moment}
            </span>
            <MomentBadge moment={m} />
          </button>
        ))}
      </MenuSection>
    ))}
  </>
);

export const HapticCheckScreen = () => {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [preview, setPreview] = useState<HapticRhythm | null>(null);
  const enabled = useSyncExternalStore(
    subscribeHapticsSetting,
    isHapticsEnabled,
    () => true,
  );

  return (
    <main className="flex h-dvh flex-col bg-muted">
      <BackHeader title="햅틱 점검" onBack={() => backToMyPage(router)} />

      <div className="flex-1 overflow-y-auto pb-[max(var(--safe-area-inset-bottom),32px)]">
        <div className="space-y-5 px-4 pt-3">
          {!isAdmin ? (
            <p className="rounded-xl bg-card px-4 py-4 text-sm text-muted-foreground">
              ADMIN 계정에서만 볼 수 있어요
            </p>
          ) : (
            <>
              <p className="rounded-xl bg-card px-4 py-3.5 text-13 leading-relaxed text-muted-foreground">
                {enabled
                  ? '버튼은 누르면 자동으로 ‘누름’ 진동이 와요. 녹음하는 동안은 어떤 진동도 오지 않아요.'
                  : '진동이 꺼져 있어요. 마이페이지 › 진동에서 켜야 느낄 수 있어요.'}
              </p>
              <KindGrid />
              <RhythmDemos onOpen={setPreview} />
              <h2 className="-mb-3 ml-1.5 text-12 font-medium text-muted-foreground">
                화면별로 오는 진동 — 줄을 누르면 그 진동이 와요
              </h2>
              <SpotList />
            </>
          )}
        </div>
      </div>
      {preview && (
        <RhythmPreview
          // 같은 리듬을 다시 열면 처음부터 다시 그린다
          key={preview}
          rhythm={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </main>
  );
};
