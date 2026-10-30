# 설문 (LAN-428, 임시)

설문 두 종류 — 일반 설문(`/survey`, 마이페이지·안내 편지)과 결제자 설문(`/survey/paid`, 안내 편지로만). 한 사람이 여러 번 낼 수 있고, 응답은 `survey_responses`에 한 행씩 쌓이며 `survey` 칸이 어느 설문인지 적는다. 설문이 끝나면 통째로 걷어낸다.

## 걷어낼 때

설문 밖에 닿은 자리는 전부 `LAN-428` 표식이 있다. `rg LAN-428 apps/web`으로 찾는다.

1. 이 폴더(`features/survey/`)와 `app/(protected)/survey/`, `app/api/survey/` 삭제
2. `rg LAN-428 apps/web`에 걸리는 줄 정리 — page-view의 `'survey'`, 편지 상세(`LetterDetailFlow`)의 CTA 한 줄과 import, `.env.example`의 설문 항목
3. Vercel 환경변수 `SUPABASE_URL`·`SUPABASE_SECRET_KEY`·`NEXT_PUBLIC_SURVEY_LETTER_ID`·`NEXT_PUBLIC_PAID_SURVEY_LETTER_ID` 제거
4. `pnpm --filter web emoji`로 안 쓰게 된 이모지(💬·💙) 에셋 정리
5. 슈퍼베이스 `survey_responses` 테이블은 응답을 다 뽑은 뒤 삭제

`shared/lib/useKeyboardInset.ts`의 수정은 설문과 무관한 버그 수정이라 남긴다.
