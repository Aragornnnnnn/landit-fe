// 답변을 영어로만 받기 위해 영어 대화에 필요 없는 글자를 걸러 내는 규칙

// 남기는 글자 — 영문·숫자·공백과 문장에 쓰는 부호. iOS가 바꿔 넣는 둥근 따옴표(’“”)도 포함한다
const NOT_ENGLISH = /[^A-Za-z0-9\s.,?!'’"“”-]/gu;

export const removeNonEnglish = (text: string) => text.replace(NOT_ENGLISH, '');
