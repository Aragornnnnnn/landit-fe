// 릴리즈 lint의 Metaspace OOM 방지 — gradle JVM 힙·메타스페이스를 확장한다 (기본 512m로는 lintVitalAnalyzeRelease가 죽는다)
const { withGradleProperties } = require('expo/config-plugins');

const JVM_ARGS_KEY = 'org.gradle.jvmargs';
const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';

module.exports = function withGradleJvmArgs(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === JVM_ARGS_KEY),
    );
    config.modResults.push({
      type: 'property',
      key: JVM_ARGS_KEY,
      value: JVM_ARGS,
    });
    return config;
  });
};
