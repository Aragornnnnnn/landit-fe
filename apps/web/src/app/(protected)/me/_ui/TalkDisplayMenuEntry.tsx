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
import { Emoji } from '@/shared/ui/emoji';

import { MenuButton, MenuGroup, MenuToggle } from './Menu';
import { SettingSheet } from './SettingSheet';

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

      <SettingSheet
        open={open}
        onClose={() => setOpen(false)}
        title="대화"
        description="대화에서 상대가 한 말을 어떻게 보여줄지 정해요"
      >
        <MenuGroup>
          <MenuToggle
            title="상대 영어 문장 항상 보기"
            checked={alwaysShowText}
            onChange={(next) => change('alwaysShowText', next)}
          />
          <MenuToggle
            title="해석 항상 보기"
            checked={alwaysShowTranslation}
            onChange={(next) => change('alwaysShowTranslation', next)}
          />
        </MenuGroup>
      </SettingSheet>
    </>
  );
};
