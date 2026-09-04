// 앱 진입점 — 안드로이드 위젯 헤드리스 태스크는 화면 없이 이 번들을 실행한다. 라우터보다 먼저 핸들러를 등록한다
import { registerAndroidWidgetTaskHandler } from './src/widgets/android/register';

import 'expo-router/entry';

registerAndroidWidgetTaskHandler();
