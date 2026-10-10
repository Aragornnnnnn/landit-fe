// 알람 문구 — 환급 제도가 열리면 환급 톤으로 바꾼다. 지금은 꺼 두고 "매일 챙겨 드리는" 톤으로 간다
const REFUND_COPY = process.env.NEXT_PUBLIC_ALARM_REFUND_COPY === 'true';

export const ALARM_COPY = REFUND_COPY
  ? {
      introTitle: '성공적인 환급을 위해\n매일 알람을 맞춰 봐요',
      pledgeClosing: '영어 공부해서\n꼭 환급받겠습니다!',
      settingsDescription: '환급을 놓치지 않도록 약속한 시간에 알려드릴게요',
    }
  : {
      introTitle: '매일 알람으로\n영어 습관 만들어 드릴게요',
      pledgeClosing: '영어 공부를 하겠습니다!',
      settingsDescription: '매일 약속한 시간에 알려드릴게요',
    };
