# alarm-scheduler

오늘의 시나리오 알람에 쓰는 네이티브 모듈이다. iOS는 AlarmKit, Android는 정확한 알람과 전체 화면 울림 화면을 쓴다.

## 출처

- [react-native-alarm-scheduler](https://github.com/prashantrajm/react-native-alarm-scheduler) 1.0.1 (npm 배포본)을 그대로 가져왔다.
- 라이선스는 MIT다. 원본 저작권 표시는 `LICENSE`에 그대로 둔다.
- 가져온 이유: 메인테이너 한 명이 관리하는 초기 라이브러리라 수정이 반영되기를 기다리기 어렵고, 패치 파일보다 코드를 직접 고치는 쪽이 읽고 리뷰하기 쉽다.

## 가져올 때 확인한 것 (1.0.1)

- 외부로 데이터를 보내는 코드가 없다. Android 인터넷 권한도 요청하지 않는다.
- 설치 때 자동으로 실행되는 스크립트와 딸린 의존성이 없다.
- 문자열을 코드로 실행하거나 숨겨 둔 코드가 없다.
- Android 권한은 알람에 필요한 것뿐이다. `FOREGROUND_SERVICE_SPECIAL_USE`는 플레이 스토어에 사용 이유를 신고해야 한다.

## 원본에서 바꾼 곳

바꾼 줄에는 `landit:` 주석을 단다.

- `app.plugin.js`: Expo 57에서 Android 권한을 넣다가 빌드가 멈추는 문제를 고쳤다 (원본 이슈 #22).
- `ios/AlarmScheduler/AlarmSchedulerAlarmKitSupport.swift`: "끄기"가 앱을 열지 않고 소리만 멈추게 했다.
- `ios/AlarmScheduler/AlarmSchedulerModule+Scheduling.swift`, `+Occurrences.swift`: 폰을 쓰는 중에 뜨는 배너의 "대화하러 가기" 아이콘을 말풍선으로, 색을 랜딧 주황으로 바꿨다.
- `android/.../AlarmSchedulerNotifications.kt`, `res/layout/landit_alarm_*.xml`: 폰을 쓰는 중에 뜨는 카드를 직접 그렸다(버튼이 처음부터 보이고, 펼치면 램프 그림이 크게). 알림을 밀어 지우면 끄기와 똑같이 멈춘다. 알림이 10초 늦게 뜨지 않게 바로 띄우고, "대화하러 가기"는 서비스를 거치지 않고 앱을 바로 열며, 알람 링크를 실으면 리액트 네이티브가 받도록 "링크 열기"(VIEW)로 보낸다.
- `android/.../AlarmSchedulerRingService.kt`, `AlarmScheduler.kt`: 폰을 쓰는 중이면 전체 화면을 띄우지 않고 카드만 띄운다.
- `android/.../AlarmSchedulerRingActivity.kt`: 전체 화면을 랜딧 디자인으로 다시 그렸다. 잠금 위에 띄우기만 하고, 잠금 해제는 "대화하러 가기"를 눌렀을 때만 요청한 뒤 화면이 직접 앱을 연다.
- `package.json`: 이름을 `@landit/alarm-scheduler`로 바꾸고 배포용 설정을 지웠다. 입구는 `index.ts`다.

## 여러 곳에 같은 값이 있는 곳

원본과의 차이를 줄이려고 한곳에 모으지 않았다. 바꿀 때는 아래를 같이 바꾼다.

- 브랜드 주황 `#E07A3A`: `AlarmSchedulerNotifications.kt`(알림 색), `AlarmSchedulerRingActivity.kt`(배경 빛·버튼 2곳), `res/drawable/landit_alarm_button_primary.xml`, iOS `+Scheduling.swift`·`+Occurrences.swift`의 `tintColor`
- 램프 그림 이름 `landit_alarm_lamp`: `apps/mobile/plugins/withAlarmLampDrawable.js`(넣는 곳), `AlarmSchedulerNotifications.kt`·`AlarmSchedulerRingActivity.kt`(찾는 곳)

## 원본을 다시 가져올 때

원본 새 버전의 변경을 읽고 필요한 부분만 옮긴다. 통째로 덮어쓰면 위의 수정이 사라진다.
