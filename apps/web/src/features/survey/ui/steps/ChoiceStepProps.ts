// 단일·복수 선택 화면이 같이 받는 props — 문항 타입만 각자 다르다
import type { Answer } from '../../model/answers';

export interface ChoiceStepProps {
  // 선택지 묶음이 이름으로 쓸 제목 요소의 id
  titleId: string;
  answer: Answer | undefined;
  // 기타를 골랐을 때 직접 쓴 내용
  otherText: string;
  proceedLabel: string;
  submitting: boolean;
  onAnswer: (answer: Answer) => void;
  onOtherText: (text: string) => void;
  onNext: () => void;
}
