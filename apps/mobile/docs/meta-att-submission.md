<!-- Meta SDK·iOS ATT 연동(LAN-157)의 동작과 App Review 제출 준비를 정리한 문서 -->

# Meta SDK · iOS ATT 연동 (LAN-157)

기존 saynow 앱을 이어받아 Meta(페이스북·인스타) 광고 설치 어트리뷰션과 앱 이벤트를 수집한다.

## 추가한 것

- `react-native-fbsdk-next`, `expo-tracking-transparency` 설치
- `app.json`
  - `react-native-fbsdk-next` 플러그인 — appID `1311169574549165`, clientToken, displayName `Landit`, autoInit·autoLogAppEvents·advertiserIDCollection 켬, `iosUserTrackingPermission: false`(ATT 문구는 tracking-transparency가 담당)
  - `expo-tracking-transparency` 플러그인 — ATT 문구
  - iOS `SKAdNetworkItems` — Meta ID 2개(`v9wttpbfk9`, `n38lu8286q`)
  - iOS `privacyManifests` — 추적 선언(기기 ID · 3rd-party 광고 목적)
- `src/analytics/meta.ts` — 앱 첫 진입에 SDK 초기화 + iOS ATT 요청 → 동의 결과로 광고 추적 on/off. `index.tsx`에서 1회 호출

## ATT 동작

- 앱 첫 실행 시 ATT 팝업이 **한 번** 뜬다. 동의 → IDFA 추적 on, 거부 → SKAdNetwork 집계만. **거부해도 앱 기능은 100% 정상.**
- 문구: "더 잘 맞는 광고를 보여주기 위해 활동 정보를 활용해요."

## App Review 제출 준비 (ATT 관련 반려·요청 대비)

### 화면 녹화 시나리오 (20~30초)

1. 앱을 **완전 삭제 후 재설치** (ATT는 1회만 떠서 초기 상태가 필요)
2. 앱 실행
3. **ATT 팝업이 뜨는 장면**을 담는다 ("… 추적하도록 허용하시겠습니까?")
4. "허용" 탭 → 앱이 정상 진입하는 것까지
5. iOS 제어센터 **화면 기록**으로 캡처 → App Store Connect 심사 노트에 첨부/설명

### 심사 노트 예시

> 앱 첫 실행 시 App Tracking Transparency 프롬프트가 표시됩니다. Meta 광고 성과 측정 목적이며, 거부해도 모든 기능이 정상 동작합니다.

## 빌드·제출 전 확인 (체크리스트)

- [ ] App Store Connect "앱 개인정보 보호" 설문이 `privacyManifests`와 일치 (기기 ID·광고 데이터 수집 + 추적 '예')
- [ ] `NSPrivacyTrackingDomains` — 현재 비어 있음. Meta 최신 가이드의 추적 도메인이 필요하면 채운다
- [ ] `SKAdNetworkItems` — Meta 공식 리스트가 갱신됐는지 확인
- [ ] EAS 빌드로 실기기에서 ATT 팝업 + Android 앱 이벤트(Meta 이벤트 매니저 수신) 확인
