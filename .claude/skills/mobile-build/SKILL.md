---
name: mobile-build
description: landit 모바일 앱(Expo, apps/mobile)을 빌드해 실기기·TestFlight·스토어에 올린다 — 실기기 로컬 실행(expo run), EAS 로컬 빌드(ipa·aab), TestFlight 제출(develop 웹뷰 qa 프로필 / 프로덕션), Play Console 업로드, 버전·빌드번호·versionCode 결정, prebuild 드리프트. "앱 빌드해줘", "테스트플라이트 올려줘", "실기기에 깔아줘", "aab 만들어", "스토어 제출", "빌드 번호 올려", "prebuild" 같은 요청에 사용한다. 스토어·TestFlight로 보내는 단계는 사용자 확인 뒤에만 한다.
---

# 모바일 빌드와 제출

## 먼저 무엇을 만들지 정한다

세 갈래다. 갈래마다 기준 커밋·프로필·번호가 다르다.

| 목적                 | 기준 커밋                      | 프로필                  | 웹뷰 URL                                                                |
| -------------------- | ------------------------------ | ----------------------- | ----------------------------------------------------------------------- |
| 실기기에서 바로 확인 | 작업 브랜치                    | `expo run:*` (EAS 아님) | `.env.local`의 `EXPO_PUBLIC_WEB_URL` (맥 LAN IP 또는 develop.landit.im) |
| TestFlight로 팀 QA   | origin/develop                 | `qa` (로컬 전용, 아래)  | develop.landit.im                                                       |
| 스토어 제출          | origin/main (릴리즈 머지 커밋) | `production`            | www.landit.im                                                           |

**웹뷰 URL은 번들 시점에 박힌다.** 빌드가 끝나면 반드시 번들에서 도메인을 확인한다(아래 "검증"). 지난번 EAS production env가 옛 도메인이라 잘못된 바이너리가 나갈 뻔했다.

## 워크트리

빌드는 전용 워크트리에서 한다. 작업 트리에서 하면 `ios/`·`android/` 생성물과 언커밋 번호 변경이 섞인다.

- iOS·TestFlight — `~/Developer/landit-fe-testflight` (detached, 기준 커밋으로 `git checkout <sha>`)
- Android — `~/Developer/landit-fe-build`

이 두 워크트리에는 **git에 없는 로컬 전용 변경**이 있다. `apps/mobile/eas.json`의 `qa`·`production-apk` 빌드 프로필과 `submit.production.ios`의 ASC API 키 셋(`ascApiKeyPath`·`ascApiKeyId`·`ascApiKeyIssuerId`). eas-cli는 언커밋 변경을 그대로 쓰므로 동작한다. **기준 커밋을 옮기기 전에 이 두 파일을 어딘가 복사해 두고, 옮긴 뒤 다시 덮어쓴다.** 커밋하지 않는다(키 경로가 절대 경로다).

없어졌으면 `qa` 프로필은 이렇다.

```json
"qa": { "extends": "production", "channel": "qa", "env": { "EXPO_PUBLIC_WEB_URL": "https://develop.landit.im" }, "android": { "buildType": "apk" } }
```

## 번호

`apps/mobile/app.json`이 소스 오브 트루스다. `version`, `ios.buildNumber`, `android.versionCode`.

- **`version`** — 네이티브가 바뀌면(expo 모듈 추가·제거, SDK 업그레이드, app.json 네이티브 설정) 반드시 올린다. runtimeVersion이 `appVersion` 정책이라, 안 올리면 옛 바이너리에 호환 안 되는 JS가 OTA로 내려가 크래시 난다. 웹 릴리즈 태그(v1.4.x)와는 다른 숫자다.
- **`buildNumber`** — 같은 `version` 안에서 ASC에 유일해야 한다. 이미 쓴 번호로 올리면 `EAS_UPLOAD_TO_ASC_VERSION_DUPLICATE`. 어디까지 썼는지는 ASC(TestFlight 빌드 목록)가 진실이다. 기억이나 메모를 믿지 말고 본다. develop 웹뷰 QA 빌드도 번호를 소모한다.
- **`versionCode`** — Play에 단조 증가. EAS 원격 카운터가 아니라 app.json 값을 쓴다(`appVersionSource: local`).

번호를 올렸으면 **그 변경을 develop에 커밋해 반영한다**(`chore(mobile): 1.3.0 iOS 빌드 9·Android versionCode 25`). 반영하지 않으면 다음 빌드가 같은 번호를 다시 쓴다. 빌드 워크트리의 언커밋 번호는 잊힌다.

## iOS

### 로컬 EAS 빌드 (기본 경로)

Apple ID 로그인 없이 ASC API 키로 서명한다. 새 팀(Team ID `X9YVD48N8N`)의 키를 환경변수로 넘긴다. 값은 `apple-account-transfer` 메모와 로컬 eas.json에 있다. 여기 적지 않는다.

```bash
cd ~/Developer/landit-fe-testflight/apps/mobile
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8          # CocoaPods 로케일. 비대화 셸은 ASCII라 pod install이 죽는다
export EXPO_ASC_API_KEY_PATH=~/Downloads/AuthKey_<KEY_ID>.p8 EXPO_ASC_KEY_ID=<KEY_ID> EXPO_ASC_ISSUER_ID=<ISSUER_ID> EXPO_APPLE_TEAM_ID=X9YVD48N8N
export SENTRY_DISABLE_AUTO_UPLOAD=true              # SENTRY_AUTH_TOKEN은 Secret이라 로컬에 안 내려온다. 없으면 릴리즈 빌드가 실패한다(웹과 다름)
eas build -p ios --profile qa --local --output out/landit-<version>-b<buildNumber>-<develop|www>.ipa
```

약 3–4분. 클라우드 빌드(`--local` 없이)는 7–8분이고 결과가 EAS 서버에 남아 `eas submit --id`로 바로 제출할 수 있다.

**새 Distribution Certificate가 필요하면 non-interactive에선 절대 안 만들어진다.** 저장된 옛 인증서를 그대로 돌려준다. 사용자가 진짜 TTY에서 `eas credentials -p ios`를 돌려야 한다. 현재 인증서는 2027-09-03 만료.

### 검증

```bash
mkdir -p /tmp/ipa && unzip -oq out/<파일>.ipa -d /tmp/ipa
/usr/bin/grep -ao 'https://[a-z.]*landit\.im' /tmp/ipa/Payload/*.app/main.jsbundle | sort -u
```

`grep`이 `rg` 별칭이라 바이너리를 건너뛴다. `/usr/bin/grep -a`를 써야 한다. qa면 develop.landit.im, production이면 www.landit.im 하나만 나와야 한다.

### TestFlight 제출

사용자 확인 뒤에.

```bash
eas submit -p ios --profile production --path out/<파일>.ipa      # 로컬 빌드
eas submit -p ios --profile production --id <buildId>               # 클라우드 빌드
```

- `submit.production.ios.ascAppId`(6787414201)는 커밋돼 있다. ASC API 키 셋은 로컬 전용 eas.json에 있어야 한다. 없으면 EAS 서버의 저장 키를 쓰는데 그건 옛 팀 것이라 ERRORED가 난다(GraphQL 에러는 null로 보인다).
- CLI가 에러 상세를 안 보여 준다. `~/.expo/state.json`의 sessionSecret으로 `api.expo.dev/graphql`에 `submissions { byId { jobRun { errors } } }`를 조회하면 나온다.
- EAS Submit 큐가 20분 넘게 IN_QUEUE면 직접 올린다. p8을 `~/.appstoreconnect/private_keys/`에 두고 `xcrun altool --upload-app -f <ipa> -t ios --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>`. 3초면 끝난다. 걸려 있는 EAS 제출은 GraphQL `submission.cancelSubmission`으로 취소.
- 도착은 ASC TestFlight 탭에서 확인. 처리에 몇 분 걸린다.

### 실기기 로컬 실행 (EAS 없이)

```bash
cd apps/mobile
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo prebuild -p ios --clean
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device <UDID> --configuration Release
```

- Release는 JS를 내장해 Metro 없이 돈다. 실기기 확인엔 디버그보다 낫다.
- 설치 단계 `InvalidHostID`는 빌드는 된 것이다. `xcrun devicectl device install app --device <coredevice-id> <.app>`로 우회.
- 서명은 새 팀 개발 인증서·프로파일이 Xcode에 있어야 한다. 옛 팀(89ZHJHVV6T) 것만 있으면 App Group `group.com.saynow.app`·위젯 타깃 프로파일이 "not available"로 실패한다.

## Android

```bash
cd ~/Developer/landit-fe-build/apps/mobile
export JAVA_HOME=/opt/homebrew/opt/openjdk@17 ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH
export EAS_NO_VCS=1 SENTRY_DISABLE_AUTO_UPLOAD=true
eas build -p android --profile production --local --output ~/Downloads/landit-<version>-vc<versionCode>-<develop|www>.aab
```

- `ANDROID_HOME`을 명시하지 않으면 "Could not receive a message from the daemon"이라는 엉뚱한 에러로 죽는다. 실제 원인은 "SDK location not found"다.
- 서명은 EAS 서버의 업로드 키스토어로 자동. 로컬 키스토어 파일은 필요 없다(사본은 `~/Downloads/@oesnuj__saynow.jks`, 원본은 EAS).
- 약 12분, 80MB대.
- 검증 — `unzip -p <aab> base/assets/index.android.bundle | /usr/bin/grep -ao 'https://[a-z.]*landit\.im' | sort -u`.
- Play 업로드는 Play Console에서 사람이 한다(eas.json에 android submit 없음). 사용자에게 파일 경로를 준다.
- 실기기 APK — `production-apk` 프로필(로컬 전용). Play가 서명한 설치본 위에는 못 덮어쓴다. 삭제 후 설치. 타깃 기기는 `ANDROID_SERIAL=<adb 시리얼>`로(expo `--device`는 시리얼 매칭이 안 된다).
- 로컬 gradle 실행(`npx expo run:android --variant release`)은 debug 키 자체 서명이라 로컬 테스트 전용.

## prebuild와 드리프트

`ios/`·`android/`는 gitignore된 생성물이다. app.json과 package.json이 진실이고, 네이티브 폴더가 그보다 낡으면 autolinking·config 플러그인이 빠져 런타임 크래시가 난다(`Cannot find native module 'ExpoTrackingTransparency'`, 파란 Expo 기본 아이콘, fbsdk 미링크). 부분 패치로는 안 잡힌다. `npx expo prebuild -p <ios|android> --clean`으로 재생성한다.

**prebuild는 `--clean` 없이도 네이티브 폴더를 통째로 지운다.** 폴더 안에 손으로 넣은 파일(키스토어 등)은 사라진다. 실제로 지워진 적이 있다. 넣지 말거나 밖에 백업한다.

EAS 로컬 빌드는 매번 깨끗이 prebuild하므로 이 문제가 없다.

## EAS 환경변수

런타임에 번들에 박히는 값은 EAS 서버 env(production)가 소스다. `eas env:list production`으로 본다. 빌드에 영향 주는 것은 `EXPO_PUBLIC_WEB_URL`, 구글 클라이언트 ID, 카카오 키, RevenueCat 공개 키 둘, Sentry DSN·프로젝트. eas.json 프로필의 `env`가 서버 값보다 우선한다(qa 프로필이 WEB_URL을 덮는 원리). 새 값은 `eas env:create --environment production --visibility plaintext`(`plain`은 안 된다).

## 끝나면

- 번호 변경을 develop에 커밋·PR (`pr` 스킬).
- 산출물 경로와 번호(버전·buildNumber·versionCode), 번들에 박힌 도메인을 사용자에게 준다.
- 빌드 워크트리의 로컬 전용 eas.json은 그대로 둔다.

## 자주 틀리는 지점

- **번호를 메모로 판단한다.** ASC·Play 콘솔이 진실이다. 중복이면 번호 올려 다시 빌드하는 것 말고 방법이 없다.
- **웹 태그 버전으로 앱 `version`을 잡는다.** 둘은 다르다.
- **네이티브 변경인데 `version`을 안 올린다.** OTA로 옛 바이너리가 죽는다.
- **`eas update --channel production`을 돌린다.** 실유저에게 즉시 나가는 배포다. 로컬 빌드 바이너리도 production 채널을 본다. 사용자 지시 없이 절대 하지 않는다.
- **검증을 건너뛴다.** 번들의 도메인 grep은 1분이다. 잘못 나간 바이너리는 심사 한 바퀴다.
