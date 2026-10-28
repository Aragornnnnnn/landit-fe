// 지금 셸 언어의 문구 묶음 — 문구를 쓰는 순간에 부른다(웹이 화면 언어를 바꿨을 수 있다)
import { shellLocale } from './shell-locale';
import { SHELL_MESSAGES, type ShellMessages } from './shell-messages';

export const shellText = (): ShellMessages => SHELL_MESSAGES[shellLocale()];
