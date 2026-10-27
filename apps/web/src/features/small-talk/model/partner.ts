// 스몰톡 대화 상대 — 누구와 얘기할지 홈에서 고른다. 상대마다 출신과 말투가 달라 자기소개가 붙는다.
// 소개 문구는 화면 고정값이다(해석은 smallTalk 묶음) — 서버는 상대 개념을 아직 모르고, 세션 시작 응답의 음성만 내려준다.
import type { Partner } from '@/features/conversation/model/character-look';
import type { TtsVoice } from '@/shared/tts/voice';

export interface PartnerProfile {
  id: Partner;
  // 아바타 아래 이름 — 영문 표기는 디자인 그대로다
  name: string;
  // 문장 안에서 부르는 이름 ("테디가 먼저 말 걸기") — smallTalk 묶음의 문구 키
  nameKey: `partner.${Partner}NameLabel`;
  // 어느 나라 영어를 쓰는지 — 이름 옆에 국기로 붙는다 (토스페이스로 그린다)
  flag: string;
  intro: string;
  // 영어 소개의 해석 — 화면 언어로 나오는 smallTalk 묶음의 문구 키
  introTranslationKey: `partner.${Partner}IntroDescription`;
  // 아바타는 얼굴만, 홈 일러스트는 상반신만 잘라 쓴다 — SVG라 viewBox로 자른다.
  // 캐릭터마다 원본 비율이 달라(테디는 곰이라 더 가로로 넓다) 값을 따로 잡는다
  avatarViewBox: string;
  portraitViewBox: string;
  // 자기소개는 미리 만든 음원을 쓴다 — 문구가 고정이라 들어올 때마다 합성할 이유가 없다
  introAudioSrc: string;
  // 음원 재생이 실패했을 때의 폴백 합성용. 홈은 세션 전이라 서버가 음성을 정해 주지 않아 여기서 들고 있는다
  voice: TtsVoice;
}

// 화면에 서는 순서 그대로 — 첫 자리(클로이)가 기본으로 서 있다
export const PARTNERS: PartnerProfile[] = [
  {
    id: 'chloe',
    introAudioSrc: '/audio/smalltalk-intro-chloe.mp3',
    name: 'Chloe',
    nameKey: 'partner.chloeNameLabel',
    flag: '🇺🇸',
    intro:
      "Hi! I'm Chloe from LA.\nI love to talk — like, a lot. Your English doesn't have to be perfect. Let's chat!",
    introTranslationKey: 'partner.chloeIntroDescription',
    avatarViewBox: '283 40 439 439',
    portraitViewBox: '185 50 650 630',
    voice: {
      provider: 'OPENROUTER',
      model: 'deepgram/aura-2',
      providerVoiceId: 'aura-2-luna-en',
      gender: 'FEMALE',
    },
  },
  {
    id: 'marco',
    introAudioSrc: '/audio/smalltalk-intro-marco.mp3',
    name: 'Marco',
    nameKey: 'partner.marcoNameLabel',
    flag: '🇦🇺',
    intro:
      "Hey, I'm Marco — a Spanish Aussie in Sydney. Spanish at home, English out there. So, how ya going?",
    introTranslationKey: 'partner.marcoIntroDescription',
    avatarViewBox: '300 66 396 396',
    portraitViewBox: '180 55 640 620',
    voice: {
      provider: 'OPENROUTER',
      model: 'deepgram/aura-2',
      providerVoiceId: 'aura-2-hyperion-en',
      gender: 'MALE',
    },
  },
  {
    id: 'teddy',
    introAudioSrc: '/audio/smalltalk-intro-teddy.mp3',
    name: 'Teddy',
    nameKey: 'partner.teddyNameLabel',
    flag: '🇬🇧',
    intro:
      "Hi, I'm Teddy. Ate something odd up in the mountains - now I speak British English. Doing odd jobs in London for honey.",
    introTranslationKey: 'partner.teddyIntroDescription',
    avatarViewBox: '0 -90 900 900',
    portraitViewBox: '34 52 840 904',
    voice: {
      provider: 'OPENROUTER',
      model: 'deepgram/aura-2',
      providerVoiceId: 'aura-2-draco-en',
      gender: 'MALE',
    },
  },
];

// 고르지 않고 바로 시작해도 한 명은 서 있어야 한다
export const DEFAULT_PARTNER: Partner = 'chloe';

// 주소에 실려 온 상대 — 손으로 고친 값이 그대로 흘러가지 않게 목록에서 확인하고, 없으면 기본 상대다
export const toPartnerId = (raw: string | null): Partner =>
  PARTNERS.find((partner) => partner.id === raw)?.id ?? DEFAULT_PARTNER;

// 목록에 없는 값이 들어오면 기본 상대를 세운다
export const findPartner = (id: Partner): PartnerProfile =>
  PARTNERS.find((partner) => partner.id === id) ??
  PARTNERS.find((partner) => partner.id === DEFAULT_PARTNER)!;
