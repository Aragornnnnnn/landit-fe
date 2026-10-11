'use client';

// 닉네임 변경 시트 — "뭐라고 불러드릴까요?"로 묻고, 백엔드와 같은 규칙에 맞을 때만 저장한다
import { useState } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { reportWarning } from '@/shared/monitoring/report';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { showToast } from '@/shared/ui/toast';

import { updateNickname } from '../_api/nickname';
import {
  countNicknameLength,
  NICKNAME_MAX_LENGTH,
  validateNickname,
} from '../_model/nickname';

const ERROR_MESSAGES = {
  too_long: `${NICKNAME_MAX_LENGTH}자까지 쓸 수 있어요`,
  invalid_char: '한글·영문·숫자와 띄어쓰기만 쓸 수 있어요',
} as const;

interface NicknameSheetProps {
  open: boolean;
  current: string;
  onClose: () => void;
}

export const NicknameSheet = ({
  open,
  current,
  onClose,
}: NicknameSheetProps) => {
  const [saving, setSaving] = useState(false);

  return (
    // 저장하는 동안에는 닫지 않는다 — 닫고 다시 연 시트를 늦게 온 응답이 닫아 버리지 않게
    <BottomSheet open={open} onClose={saving ? () => {} : onClose}>
      {/* 닫힘 동안 언마운트 — 다시 열면 그때의 이름으로 새로 채워진다 */}
      {open && (
        <NicknameForm
          current={current}
          saving={saving}
          onSavingChange={setSaving}
          onDone={onClose}
        />
      )}
    </BottomSheet>
  );
};

const NicknameForm = ({
  current,
  saving,
  onSavingChange,
  onDone,
}: {
  current: string;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onDone: () => void;
}) => {
  const setNickname = useAuthStore((state) => state.setNickname);
  const keyboardInset = useKeyboardInset();
  const [input, setInput] = useState(current);
  const [saveFailed, setSaveFailed] = useState(false);

  const result = validateNickname(input);
  // 빈칸은 버튼만 막는다 — 지우고 새로 쓰는 중에 경고부터 띄우면 혼나는 느낌이다
  const errorMessage =
    !result.ok && result.reason !== 'empty'
      ? ERROR_MESSAGES[result.reason]
      : null;
  const unchanged = result.ok && result.value === current.trim();
  const length = countNicknameLength(input);
  const tooLong = !result.ok && result.reason === 'too_long';

  const save = async () => {
    if (!result.ok || saving) return;
    onSavingChange(true);
    setSaveFailed(false);
    try {
      const { nickname } = await updateNickname(result.value);
      setNickname(nickname);
      showToast(`이제 ${nickname}님으로 불러드릴게요`);
      onDone();
    } catch (error) {
      reportWarning(error);
      setSaveFailed(true);
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      // 키보드가 시트 아래를 가리지 않게 그만큼 띄운다
      style={{ paddingBottom: keyboardInset }}
    >
      <h2 className="text-[17px] font-bold text-foreground">
        뭐라고 불러드릴까요?
      </h2>
      <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
        언제든 다시 바꿀 수 있어요
      </p>

      <div
        className={`mt-5 flex items-center gap-2 rounded-xl border-2 bg-muted px-4 transition-colors ${
          errorMessage
            ? 'border-destructive'
            : 'border-transparent focus-within:border-primary'
        }`}
      >
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setSaveFailed(false);
          }}
          autoFocus
          enterKeyHint="done"
          autoComplete="nickname"
          aria-label="닉네임"
          aria-invalid={errorMessage !== null}
          className="h-13 min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="이름을 입력해 주세요"
        />
        <span
          className={`shrink-0 text-[13px] tabular-nums ${
            tooLong ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {length}/{NICKNAME_MAX_LENGTH}
        </span>
      </div>
      <p
        className="mt-2 min-h-5 px-1 text-[13px] text-destructive"
        role="alert"
      >
        {errorMessage ??
          (saveFailed ? '저장하지 못했어요. 다시 시도해 주세요' : '')}
      </p>

      <Button
        type="submit"
        className="mt-3"
        disabled={!result.ok || unchanged}
        loading={saving}
      >
        이 이름으로 할게요
      </Button>
    </form>
  );
};
