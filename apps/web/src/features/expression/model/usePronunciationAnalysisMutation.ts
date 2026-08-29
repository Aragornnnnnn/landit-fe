// 발음 분석 요청 mutation — 녹음 파일을 올리고 단어별 판정을 받는다
import { useMutation } from '@tanstack/react-query';

import { postPronunciationAnalysis } from '../api/pronunciation';
import type { SentenceRecording } from '../lib/sentence-recording';

export const usePronunciationAnalysisMutation = (expressionId: number) =>
  useMutation({
    mutationFn: (recording: SentenceRecording) =>
      postPronunciationAnalysis(
        expressionId,
        recording.blob,
        recording.filename,
      ),
  });
