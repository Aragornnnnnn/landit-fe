// 셸이 웹에 주입하는 네이티브 컨텍스트 스키마·직렬화 — 앱 버전·플랫폼을 웹 계측(앰플리튜드)에 전달한다
import { z } from 'zod';

// 브릿지 계약 버전 — 브릿지 메시지/컨텍스트 규격이 바뀌면 올린다. 웹이 구 셸 능력 판단에 쓴다
export const NATIVE_BRIDGE_VERSION = 1;

// 셸이 주입하고 웹이 읽는 전역 키
export const NATIVE_CONTEXT_GLOBAL = '__LANDIT_NATIVE__';

export const nativeContextSchema = z.object({
  platform: z.enum(['ios', 'android']),
  // app.json version — 예: "1.0.0"
  appVersion: z.string().min(1),
  // iOS buildNumber / Android versionCode. 스토어 빌드 번호가 없으면 null
  buildNumber: z.string().nullable(),
  bridgeVersion: z.number().int(),
});

export type NativeContext = z.infer<typeof nativeContextSchema>;

// 셸이 WebView injectedJavaScriptBeforeContentLoaded에 넣을 스크립트를 만든다.
// 콘텐츠 로드 전 동기 실행돼 전역을 세팅한다. 끝을 true;로 마감해 iOS의 injectedJS 반환값 경고를 막는다
export function buildNativeContextScript(context: NativeContext): string {
  return `window.${NATIVE_CONTEXT_GLOBAL} = ${JSON.stringify(context)}; true;`;
}

// 웹이 주입값(window.__LANDIT_NATIVE__)을 검증해 반환한다. 없거나(브라우저) 규격 밖이면 null
export function readNativeContext(raw: unknown): NativeContext | null {
  const result = nativeContextSchema.safeParse(raw);
  return result.success ? result.data : null;
}
