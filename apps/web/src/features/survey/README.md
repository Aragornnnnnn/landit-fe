# 설문 (LAN-428, 임시)

설문 두 종류 — 일반 설문(`/survey`, 마이페이지·안내 편지)과 결제자 설문(`/survey/paid`, 안내 편지로만). 한 사람이 여러 번 낼 수 있고, 응답은 `survey_responses`에 한 행씩 쌓이며 `survey` 칸이 어느 설문인지 적는다. 설문이 끝나면 통째로 걷어낸다.

## LAN-886 저장소 전환

관리형 FE 서버의 `LANDIT_SURVEY_RDS_URL`과 `LANDIT_SURVEY_RDS_TOKEN`을 함께 설정하면 기존 인증·설문 검증을 마친 응답을 RDS 연동 API로 보낸다. 둘 중 하나만 설정하면 저장 오류로 처리한다. 일반 설문과 결제자 설문은 모두 종류를 전달한다. 두 설정이 비어 있으면 Supabase를 사용한다.

작업창에 `LANDIT_SURVEY_WRITES_PAUSED=true`로 배포하면 설문 저장만 503으로 응답한다. 최종 복원과 RDS 경로 확인 후 중지 플래그를 해제한다.

## 걷어낼 때

설문 밖에 닿은 자리는 전부 `LAN-428` 표식이 있다. `rg LAN-428 apps/web`으로 찾는다.

1. 이 폴더(`features/survey/`)와 `app/(app)/(protected)/survey/`, `app/api/survey/` 삭제
2. `rg LAN-428 apps/web`에 걸리는 줄 정리 — page-view의 `'survey'`, 편지 상세(`LetterDetailFlow`)의 CTA 한 줄과 import, `.env.example`의 설문 항목
3. Vercel 환경변수 `SUPABASE_URL`·`SUPABASE_SECRET_KEY`·`NEXT_PUBLIC_SURVEY_LETTER_ID`·`NEXT_PUBLIC_PAID_SURVEY_LETTER_ID` 제거
4. `pnpm --filter web emoji`로 안 쓰게 된 이모지(💬·💙) 에셋 정리
5. 운영 저장소의 `survey_responses` 테이블은 응답을 다 뽑고 사용자 연계·푸시 조회 영향까지 확인한 뒤 정리

`shared/lib/useKeyboardInset.ts`의 수정은 설문과 무관한 버그 수정이라 남긴다.

## 결제자 설문의 롤플레이 보기

만족 기능 문항의 롤플레이 보기는 기본으로 꺼져 있다. Vercel 환경변수 `NEXT_PUBLIC_PAID_SURVEY_ROLEPLAY`를 `true`로 두고 다시 배포하면 스몰톡 뒤에 나타난다.
