'use client';

// 매일 알람 시각을 바로 정해 저장한다 — 다짐(지문 3초) 없이 폰 기본 시각 선택기로 고른다
import { useState } from 'react';

import {
  DEFAULT_ALARM_TIME,
  toServerTime,
} from '@/features/alarm/model/alarm-time';
import { Emoji } from '@/shared/ui/emoji';

import { ROW_CLASS, ROW_STYLE } from '../../_ui/Menu';

export const DailyTimeRow = ({
  serverTime,
  alarmOn,
  saving,
  onSave,
}: {
  /** 서버에 저장된 시각 "HH:mm". 없으면 기본 시각에서 시작한다 */
  serverTime: string | null;
  /** 서버 알람이 켜져 있는가 — 꺼져 있으면 같은 시각이어도 저장하면 켜진다 */
  alarmOn: boolean;
  /** 저장이 진행 중인가 */
  saving: boolean;
  onSave: (time: string) => void;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const time = draft ?? serverTime ?? toServerTime(DEFAULT_ALARM_TIME);
  // 이미 켜져 있고 시각도 그대로면 저장할 것이 없다
  const unchanged = alarmOn && time === serverTime;
  return (
    <div className={`${ROW_CLASS} active:bg-transparent`} style={ROW_STYLE}>
      <Emoji>⏰</Emoji>
      <label
        htmlFor="daily-alarm-time"
        className="flex-1 text-[15px] whitespace-nowrap text-foreground"
      >
        시각 정하기
      </label>
      <input
        id="daily-alarm-time"
        type="time"
        value={time}
        onChange={(event) => setDraft(event.target.value)}
        className="rounded-lg bg-muted px-2.5 py-1.5 text-[15px] font-bold text-foreground tabular-nums"
      />
      <button
        type="button"
        disabled={saving || time === '' || unchanged}
        onClick={() => onSave(time)}
        className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-bold text-primary-foreground active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:active:scale-100"
      >
        저장
      </button>
    </div>
  );
};
