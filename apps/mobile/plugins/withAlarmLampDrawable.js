// 알람 울림 화면·알림에 쓰는 래디 램프 그림을 Android 리소스로 넣는다 — 라이브러리 패치가 이름(landit_alarm_lamp)으로 찾는다
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const SOURCE = 'assets/images/alarm-lamp.webp';
const TARGET = 'drawable-nodpi/landit_alarm_lamp.webp';

module.exports = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const { projectRoot, platformProjectRoot } = config.modRequest;
      const target = path.join(platformProjectRoot, 'app/src/main/res', TARGET);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(projectRoot, SOURCE), target);
      return config;
    },
  ]);
