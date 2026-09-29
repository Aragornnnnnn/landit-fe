// 첫 페인트 전에 <html data-platform="android">을 찍는 인라인 스크립트 — CSS가 Android 하단 틈을 고른다

// 문자열로 바뀌어 모듈 밖에서 실행되므로 바깥 변수를 참조하지 않는다 (전역 키도 리터럴로 쓴다)
export const markNativePlatform = () => {
  const native = (window as { __LANDIT_NATIVE__?: { platform?: unknown } })
    .__LANDIT_NATIVE__;
  if (native?.platform === 'android') {
    document.documentElement.dataset.platform = 'android';
  }
};

export const platformMarkerScript = `(${markNativePlatform.toString()})()`;
