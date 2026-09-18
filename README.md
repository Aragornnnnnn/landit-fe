# pr-assets

PR 본문에 넣는 캡처 이미지를 모아 두는 브랜치. 코드와 히스토리를 공유하지 않는 별도 트리다.

- 이미지는 `lanXXX/` 폴더에 두고, PR 본문에서는 `https://raw.githubusercontent.com/Aragornnnnnn/landit-fe/pr-assets/lanXXX/파일.png` raw 링크로 참조한다.
- `apps/web/vercel.json`은 이 브랜치 푸시가 Vercel 배포를 만들지 않게 막는 설정이다. Vercel 프로젝트의 Root Directory가 `apps/web`이라 그 경로에 있어야 읽힌다. 지우지 말 것.
