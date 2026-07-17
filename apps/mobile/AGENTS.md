# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## OTA(EAS Update) 주의

- runtimeVersion은 `appVersion` 정책이다 — 네이티브가 바뀌는 변경(expo 모듈 추가·제거, SDK 업그레이드, app.json의 네이티브 설정 변경)에는 **반드시 app.json `version`을 올린다.** 안 올리면 옛 바이너리에 호환되지 않는 JS가 OTA로 내려가 크래시 난다.
- 로컬 빌드 바이너리도 전부 production 채널을 바라본다 (`updates.requestHeaders`). `eas update --channel production`은 실유저에게 즉시 나가는 배포다.
