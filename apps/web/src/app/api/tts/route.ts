// OpenRouter TTS 합성을 중계하는 프록시 라우트 — API 키를 서버에만 두고 mp3 스트림을 그대로 전달
import { NextResponse } from 'next/server';

const SPEECH_URL = 'https://openrouter.ai/api/v1/audio/speech';

// 비용 악용 방어 — 키가 서버에만 있어도 이 라우트는 공개라, 호출당 비용을 작은 고정값으로 묶는다.
// 제대로 된 세션 인증은 런칭 전 별도 이슈(LAN-118 후속)로 다룬다
const MAX_INPUT_LENGTH = 1000;
// 우리 키로 임의 모델을 부르지 못하게 TTS 모델만 허용 (백엔드 시드 model과 일치)
const ALLOWED_MODELS = ['microsoft/mai-voice-2'];

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY가 설정되지 않았습니다.' },
      { status: 500 },
    );
  }

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

  const res = await fetch(SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input, voice, response_format: 'mp3' }),
  });

  if (!res.ok) {
    console.error('[tts] 합성 실패:', res.status, await res.text());
    return NextResponse.json(
      { error: 'TTS 합성 실패' },
      { status: res.status },
    );
  }

  return new Response(res.body, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
