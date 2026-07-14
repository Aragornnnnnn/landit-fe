// 시나리오 첫 AI 발화를 미리 합성해 public/audio/opening-{scenarioId}.mp3로 저장하는 일회성 스크립트.
// 오프닝은 시나리오마다 고정이라 정적 에셋으로 번들해 대화 진입 시 즉시 재생한다. (오프닝 문구가 바뀌면 다시 실행)
//
// 준비: web dev 서버가 localhost:3000에 떠 있어야 한다 (/api/tts 프록시가 OPENROUTER 키를 씀).
// 사용: 로그인된 상태로 GET /api/v1/scenarios 응답을 파일로 저장한 뒤
//   node apps/web/scripts/generate-opening-audio.mjs <scenarios.json>
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const TTS_URL = 'http://localhost:3000/api/tts';
const OUT_DIR = new URL('../public/audio/', import.meta.url);

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('사용법: node generate-opening-audio.mjs <scenarios.json>');
  process.exit(1);
}

const raw = JSON.parse(await readFile(inputPath, 'utf8'));
// 응답 봉투({ success, data }) 또는 data 자체 둘 다 허용
const root = raw.data ?? raw;
const scenarios = (root.categories ?? []).flatMap((c) => c.scenarios ?? []);

await mkdir(OUT_DIR, { recursive: true });

let done = 0;
let skipped = 0;
const manifest = [];

for (const s of scenarios) {
  const p = s.openingPreview;
  // AI 선발화 + 오프닝 텍스트 + 음성이 다 있어야 합성 대상
  if (s.firstSpeaker !== 'AI' || !p?.aiOpeningMessage || !p?.ttsVoice) {
    skipped += 1;
    continue;
  }

  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: p.aiOpeningMessage,
      model: p.ttsVoice.model,
      voice: p.ttsVoice.providerVoiceId,
    }),
  });

  if (!res.ok) {
    console.error(`✗ ${s.scenarioId}: ${res.status} ${await res.text()}`);
    continue;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(new URL(`opening-${s.scenarioId}.mp3`, OUT_DIR), buf);
  manifest.push(s.scenarioId);
  console.log(
    `✓ ${s.scenarioId} (${buf.length}B) — ${p.aiOpeningMessage.slice(0, 42)}…`,
  );
  done += 1;
}

// 어떤 시나리오에 오디오가 있는지 FE가 알도록 매니페스트도 남긴다
await writeFile(
  new URL('openings.json', OUT_DIR),
  JSON.stringify(manifest, null, 2),
);

console.log(
  `\n완료: ${done}개 생성 · ${skipped}개 건너뜀 · manifest ${manifest.length}개`,
);
