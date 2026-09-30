'use client';

// 마이페이지 "대화" 행 — 눌러 들어간 시트에서 대화를 시작할 때 상대 말을 글자·해석으로 어떻게 보일지 고른다. 값은 이 기기의 localStorage에만 산다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import {
  setDisplaySetting,
  type DisplaySettingKey,
} from '@/features/conversation/model/talk-display';
import { useDisplaySetting } from '@/features/conversation/model/useTalkDisplay';
import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import { MenuButton, MenuGroup, MenuToggle } from './Menu';

// 계측 속성 값은 스네이크 케이스로 남긴다
const SETTING_NAME: Record<
  DisplaySettingKey,
  'always_show_text' | 'always_show_translation'
> = {
  alwaysShowText: 'always_show_text',
  alwaysShowTranslation: 'always_show_translation',
};

export const TalkDisplayMenuEntry = () => {
  const [open, setOpen] = useState(false);
  const alwaysShowText = useDisplaySetting('alwaysShowText');
  const alwaysShowTranslation = useDisplaySetting('alwaysShowTranslation');

  const change = (key: DisplaySettingKey, next: boolean) => {
    setDisplaySetting(key, next);
    track(EVENTS.TALK_DISPLAY_CHANGED, {
      setting: SETTING_NAME[key],
      enabled: next,
    });
  };

  return (
    <>
      <MenuButton
        title="대화"
        icon={<Emoji>👀</Emoji>}
        onClick={() => setOpen(true)}
      />

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="text-[17px] font-bold" style={{ color: '#111' }}>
          대화
        </h2>
        <p
          className="mt-1 mb-4 text-[14px] leading-6"
          style={{ color: '#666' }}
        >
          대화에서 상대가 한 말을 어떻게 보여줄지 정해요
        </p>
        <MenuGroup>
          <MenuToggle
            title="상대 말 글자 항상 보기"
            checked={alwaysShowText}
            onChange={(next) => change('alwaysShowText', next)}
          />
          <MenuToggle
            title="해석 항상 보기"
            checked={alwaysShowTranslation}
            onChange={(next) => change('alwaysShowTranslation', next)}
          />
        </MenuGroup>
        <div className="mt-5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            닫기
          </Button>
        </div>
      </BottomSheet>
    </>
  );
};
