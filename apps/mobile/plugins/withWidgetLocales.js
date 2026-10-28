// 위젯 고르는 화면의 이름·설명·미리보기를 기기 언어(ko·ja)로 — OS가 그리는 화면이라 리소스 번역으로만 바꿀 수 있다
const fs = require('fs');
const path = require('path');
const plist = require('@expo/plist').default;
const {
  withDangerousMod,
  withXcodeProject,
  XML,
} = require('expo/config-plugins');

// 위젯 이름·설명 번역표 — 안드로이드는 리소스 이름으로, iOS는 한국어 원문을 키로 쓴다
const STRINGS = {
  landit_widget_label: { ko: '랜딧', ja: 'Landit' },
  landit_widget_description: {
    ko: '래디와 함께 매일 대화 스트릭을 지켜요',
    ja: 'ラディと毎日、会話の連続記録を守りましょう',
  },
  landit_widget_description_large: {
    ko: '래디와 함께 매일 대화 스트릭과 주간 기록을 지켜요',
    ja: 'ラディと毎日、会話の連続記録と週の記録を守りましょう',
  },
};
const LANGUAGES = ['ko', 'ja'];

// 안드로이드 미리보기 — react-native-android-widget이 drawable/{위젯}_preview로 복사한 것의 일본어판
const ANDROID_PREVIEWS = {
  streaksmall_preview: 'assets/widgets/ja/preview-small.webp',
  streakmedium_preview: 'assets/widgets/ja/preview-medium.webp',
  streaklarge_preview: 'assets/widgets/ja/preview-large.webp',
};

const IOS_WIDGET_TARGET = 'ExpoWidgetsTarget';
const IOS_STRINGS_PATH = (language) => `${language}.lproj/Localizable.strings`;

// 기본(values)은 한국어, values-ja는 일본어 — 문자열 이스케이프는 expo XML 쓰기가 맡는다
const writeAndroidStrings = async (res, language) => {
  const dir = path.join(
    res,
    language === 'ko' ? 'values' : `values-${language}`,
  );
  fs.mkdirSync(dir, { recursive: true });
  await XML.writeXMLAsync({
    path: path.join(dir, 'landit_widget_strings.xml'),
    xml: {
      resources: {
        string: Object.entries(STRINGS).map(([name, text]) => ({
          $: { name },
          _: text[language],
        })),
      },
    },
  });
};

const withAndroidWidgetLocales = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const { projectRoot, platformProjectRoot } = config.modRequest;
      const res = path.join(platformProjectRoot, 'app/src/main/res');
      for (const language of LANGUAGES) {
        await writeAndroidStrings(res, language);
      }

      const drawable = path.join(res, 'drawable-ja');
      fs.mkdirSync(drawable, { recursive: true });
      for (const [name, source] of Object.entries(ANDROID_PREVIEWS)) {
        fs.copyFileSync(
          path.join(projectRoot, source),
          path.join(drawable, `${name}.webp`),
        );
      }
      return config;
    },
  ]);

// expo-widgets가 Swift에 넣는 이름·설명 원문 — 번역표에 없으면 일본어가 조용히 빠지므로 빌드를 멈춘다
const iosWidgetTexts = (config) => {
  const entry = config.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets',
  );
  const texts = (entry?.[1]?.widgets ?? []).flatMap((widget) => [
    widget.displayName,
    widget.description,
  ]);
  const known = Object.values(STRINGS).map(({ ko }) => ko);
  const missing = texts.filter((text) => text && !known.includes(text));
  if (texts.length === 0 || missing.length > 0) {
    throw new Error(
      `[withWidgetLocales] expo-widgets 이름·설명이 번역표에 없다: ${missing.join(', ') || '(위젯 없음)'}`,
    );
  }
  return texts.filter(Boolean);
};

const stringsFile = (texts, language) =>
  texts
    .map((ko) => {
      const text = Object.values(STRINGS).find((entry) => entry.ko === ko);
      return `"${ko}" = "${text[language]}";`;
    })
    .join('\n') + '\n';

// 위젯 타깃에 ko·ja Localizable.strings를 리소스로 넣는다 — 타깃에 리소스 단계가 없어 같이 만든다
const withIosWidgetLocales = (config) =>
  withXcodeProject(config, (config) => {
    const project = config.modResults;
    const objects = project.hash.project.objects;
    const targetKey = project.findTargetKey(IOS_WIDGET_TARGET);
    const groupKey = project.findPBXGroupKey({ name: IOS_WIDGET_TARGET });
    if (!targetKey || !groupKey) {
      console.warn(
        `[withWidgetLocales] ${IOS_WIDGET_TARGET} 타깃을 찾지 못해 위젯 이름 번역을 건너뛴다`,
      );
      return config;
    }

    const targetDir = path.join(
      config.modRequest.platformProjectRoot,
      IOS_WIDGET_TARGET,
    );
    const texts = iosWidgetTexts(config);
    for (const language of LANGUAGES) {
      const file = path.join(targetDir, IOS_STRINGS_PATH(language));
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, stringsFile(texts, language));
    }

    // 맞는 언어가 없는 기기(영어 등)는 개발 언어로 떨어진다 — 위젯 번들에 없으면 ja를 고를 수 있어 ko로 못박는다
    const infoPlistPath = path.join(targetDir, 'Info.plist');
    const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
    infoPlist.CFBundleDevelopmentRegion = 'ko';
    fs.writeFileSync(infoPlistPath, plist.build(infoPlist));

    // 이미 넣었으면(--clean 없이 prebuild를 다시 돌림) 그대로 둔다
    if (
      Object.values(objects.PBXFileReference).some(
        (ref) => ref?.path === `"${IOS_STRINGS_PATH('ja')}"`,
      )
    ) {
      return config;
    }

    // 위젯 타깃 자기 리소스 단계 — 라이브러리의 타깃별 찾기는 못 찾으면 앱 타깃 단계를 돌려줘서 직접 고른다
    const target = project.pbxNativeTargetSection()[targetKey];
    const resourcesPhase =
      target.buildPhases
        .map(({ value }) => objects.PBXResourcesBuildPhase?.[value])
        .find(Boolean) ??
      project.addBuildPhase(
        [],
        'PBXResourcesBuildPhase',
        'Resources',
        targetKey,
      ).buildPhase;

    const variantKey = project.pbxCreateVariantGroup('Localizable.strings');
    project.addToPbxGroup(variantKey, groupKey);
    for (const language of LANGUAGES) {
      const fileRef = project.generateUuid();
      objects.PBXFileReference[fileRef] = {
        isa: 'PBXFileReference',
        lastKnownFileType: 'text.plist.strings',
        name: language,
        path: `"${IOS_STRINGS_PATH(language)}"`,
        sourceTree: '"<group>"',
      };
      objects.PBXFileReference[`${fileRef}_comment`] = language;
      project
        .getPBXVariantGroupByKey(variantKey)
        .children.push({ value: fileRef, comment: language });
      project.addKnownRegion(language);
    }

    const buildFile = {
      uuid: project.generateUuid(),
      fileRef: variantKey,
      basename: 'Localizable.strings',
      group: 'Resources',
    };
    project.addToPbxBuildFileSection(buildFile);
    resourcesPhase.files.push({
      value: buildFile.uuid,
      comment: 'Localizable.strings in Resources',
    });
    return config;
  });

module.exports = (config) =>
  withIosWidgetLocales(withAndroidWidgetLocales(config));
