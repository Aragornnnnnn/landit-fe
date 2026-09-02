// 이 기기에서 설문을 마쳤는지 — 다시 들어오면 문항 대신 완료 화면을 보여준다.
// 기기가 바뀌면 다시 뜨지만, 저장소의 user_id 기본키가 두 번째 제출을 막아 완료 화면으로 끝난다
import { seenFlag } from '@/shared/lib/seen-flag';

export const surveyDone = seenFlag('survey-done');
