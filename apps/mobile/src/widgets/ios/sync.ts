// iOS 위젯 동기화 — 아트를 App Group 공유 디렉터리에 복사하고 타임라인을 새로 예약한다
import type { WidgetData } from '@landit/bridge';

import { buildTimelineEntries } from './props';

let artDirPromise: Promise<string | null> | null = null;

// 위젯 익스텐션은 별도 프로세스라 앱 번들을 못 읽는다 — expo-widgets가 지원하는 유일한 이미지 통로인
// App Group 공유 디렉터리(widgetsDirectory)로 번들 아트를 1회 복사한다 (앱 실행 전에는 위젯이 폴백 배경으로 뜬다)
const ensureWidgetArt = (): Promise<string | null> => {
  artDirPromise ??= copyArtToSharedDirectory().catch((error) => {
    console.warn('[widget] 아트 복사 실패', error);
    artDirPromise = null;
    return null;
  });
  return artDirPromise;
};

const copyArtToSharedDirectory = async (): Promise<string | null> => {
  // 네이티브 모듈이 없는 환경(Expo Go 등)에서 앱이 죽지 않도록 지연 로드한다
  const { Asset } = require('expo-asset') as typeof import('expo-asset');
  const FileSystem =
    require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
  const { widgetsDirectory } = require('expo-widgets') as {
    widgetsDirectory: string | null;
  };
  const { WIDGET_ART, WIDGET_ART_VERSION } =
    require('../art/widget-art') as typeof import('../art/widget-art');
  if (widgetsDirectory === null) return null;

  const dir = widgetsDirectory.endsWith('/')
    ? widgetsDirectory
    : `${widgetsDirectory}/`;
  // 버전 마커가 있으면 이미 복사된 아트다 — 아트를 바꿀 때 WIDGET_ART_VERSION을 올려 다시 복사시킨다
  const marker = `${dir}art-v${WIDGET_ART_VERSION}`;
  if ((await FileSystem.getInfoAsync(marker)).exists) return dir;

  for (const [key, moduleId] of Object.entries(WIDGET_ART)) {
    // dev에서는 에셋이 디스크가 아닌 Metro 서버에 있다 — downloadAsync가 두 모드 모두 로컬 파일 경로를 보장한다
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    // 한 장이라도 못 받으면 멈춘다 — 그냥 넘기면 마커만 남아 그 그림은 영영 안 깔린다
    if (asset.localUri == null) {
      throw new Error(`위젯 아트를 받지 못했다: ${key}`);
    }
    const to = `${dir}${key}.webp`;
    await FileSystem.deleteAsync(to, { idempotent: true });
    await FileSystem.copyAsync({ from: asset.localUri, to });
  }
  await FileSystem.writeAsStringAsync(marker, 'ok');
  return dir;
};

export const syncIosWidget = async (data: WidgetData): Promise<void> => {
  try {
    const streakWidget = (
      require('./StreakWidget') as typeof import('./StreakWidget')
    ).default;
    const artDir = await ensureWidgetArt();
    streakWidget.updateTimeline(
      buildTimelineEntries({ data, now: new Date(), artDir }),
    );
  } catch (error) {
    console.warn('[widget] iOS 타임라인 동기화 실패', error);
  }
};
