// androidx.work 버전 정렬 — 위젯 라이브러리(WorkManager)와 다른 의존성이 서로 다른 버전을 끌어와
// checkDebugDuplicateClasses가 깨지는 것을 막는다 (runtime과 runtime-ktx를 같은 버전으로 강제)
const { withAppBuildGradle } = require('expo/config-plugins');

const WORK_VERSION = '2.8.1';
const MARKER = '// androidx.work alignment (withAndroidxWorkAlignment)';
const BLOCK = `
${MARKER}
dependencies {
    implementation("androidx.work:work-runtime:${WORK_VERSION}")
    implementation("androidx.work:work-runtime-ktx:${WORK_VERSION}")
}
`;

module.exports = function withAndroidxWorkAlignment(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += BLOCK;
    }
    return config;
  });
};
