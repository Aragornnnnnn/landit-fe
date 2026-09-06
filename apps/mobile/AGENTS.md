# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## OTA(EAS Update) 주의

- runtimeVersion은 `appVersion` 정책이다 — 네이티브가 바뀌는 변경(expo 모듈 추가·제거, SDK 업그레이드, app.json의 네이티브 설정 변경)에는 **반드시 app.json `version`을 올린다.** 안 올리면 옛 바이너리에 호환되지 않는 JS가 OTA로 내려가 크래시 난다.
- 로컬 빌드 바이너리도 전부 production 채널을 바라본다 (`updates.requestHeaders`). `eas update --channel production`은 실유저에게 즉시 나가는 배포다.

## 홈 위젯

- 동작 방식은 [docs/widget.md](../../docs/widget.md) 참고. 값 흐름·갱신 시점·플랫폼별 차이가 정리돼 있다.
- 위젯에 보여줄 상태 판정은 `src/widgets/model/widget-state.ts` **한 곳**이다. iOS·안드로이드가 같은 결과를 쓰므로 플랫폼별로 나누지 않는다.
- iOS 화면(`StreakWidget.tsx`)은 함수를 소스 문자열로 직렬화해 실행한다 — **함수 밖 값은 위젯 런타임에 없다.** 상수도 함수 안에 둔다.
- 안드로이드 화면 파일의 `'use no memo'`를 지우면 위젯이 아예 안 그려진다.
