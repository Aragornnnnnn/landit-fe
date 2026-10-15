// TTS 합성을 중계하는 프록시 라우트 — Deepgram 음성은 Deepgram에, 나머지는 OpenRouter에 보내고 mp3를 전달
import { NextResponse } from 'next/server';

import { reportError } from '@/shared/monitoring/report';

import { mergeConcatenatedMp3 } from './mp3';

const OPENROUTER_SPEECH_URL = 'https://openrouter.ai/api/v1/audio/speech';
const DEEPGRAM_SPEECH_URL = 'https://api.deepgram.com/v1/speak';
const DEEPGRAM_MODEL = 'deepgram/aura-2';

// 비용 악용 방어 — 키가 서버에만 있어도 이 라우트는 공개라, 호출당 비용을 작은 고정값으로 묶는다.
// 제대로 된 세션 인증은 런칭 전 별도 이슈(LAN-118 후속)로 다룬다
const MAX_INPUT_LENGTH = 1000;
// 우리 키로 임의 모델을 부르지 못하게 TTS 모델만 허용 (백엔드 시드 model과 일치)
const ALLOWED_MODELS = [
  'microsoft/mai-voice-2',
  'deepgram/aura-2',
  'hexgrad/kokoro-82m',
];

// 업스트림별 합성 요청 — Deepgram은 음성 이름이 곧 모델이라 voice를 model 파라미터로 보낸다
const requestSpeech = (
  apiKey: string,
  { model, input, voice }: { model: string; input: string; voice: string },
) =>
  model === DEEPGRAM_MODEL
    ? fetch(
        `${DEEPGRAM_SPEECH_URL}?${new URLSearchParams({ model: voice, encoding: 'mp3' })}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: input }),
        },
      )
    : fetch(OPENROUTER_SPEECH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, input, voice, response_format: 'mp3' }),
      });

export async function POST(request: Request) {
  const { input, model, voice } = (await request.json()) as {
    input?: string;
    model?: string;
    voice?: string;
  };
  if (!input || !model || !voice) {
    return NextResponse.json(
      { error: 'input, model, voice는 필수입니다.' },
      { status: 400 },
    );
  }
  if (input.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `input은 ${MAX_INPUT_LENGTH}자 이하여야 합니다.` },
      { status: 400 },
    );
  }
  if (!ALLOWED_MODELS.includes(model)) {
    return NextResponse.json(
      { error: '허용되지 않은 model입니다.' },
      { status: 400 },
    );
  }

  // 같은 Deepgram 키로 다른 Deepgram 모델을 부르지 못하게 aura-2 음성만 받는다
  if (model === DEEPGRAM_MODEL && !voice.startsWith('aura-2-')) {
    return NextResponse.json(
      { error: '허용되지 않은 voice입니다.' },
      { status: 400 },
    );
  }

  const keyName =
    model === DEEPGRAM_MODEL ? 'DEEPGRAM_TTS_API_KEY' : 'OPENROUTER_API_KEY';
  const apiKey = process.env[keyName];
  if (!apiKey) {
    return NextResponse.json(
      { error: `${keyName}가 설정되지 않았습니다.` },
      { status: 500 },
    );
  }

  const res = await requestSpeech(apiKey, { model, input, voice });

  if (!res.ok) {
    const detail = await res.text();
    console.error('[tts] 합성 실패:', res.status, detail);
    reportError(new Error('[tts] 합성 실패'), { status: res.status, detail });
    return NextResponse.json(
      { error: 'TTS 합성 실패' },
      { status: res.status },
    );
  }

  // 문장별로 이어 붙은 MP3(현재 Kokoro)는 길이 정보가 첫 문장 몫만 적혀 고쳐서 넘긴다 — 한 스트림이면 그대로 나간다
  const audio = mergeConcatenatedMp3(new Uint8Array(await res.arrayBuffer()));
  return new Response(audio, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
