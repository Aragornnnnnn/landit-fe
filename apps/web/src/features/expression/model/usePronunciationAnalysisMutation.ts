// 발음 분석 요청 배선
import { useMutation } from '@tanstack/react-query';

import { postPronunciationAnalysis } from '../api/pronunciation';
import type { SentenceRecording } from '../lib/sentence-recording';

/** 발음 분석 요청 mutation — 녹음(blob·파일명)을 올리고 점수·단어별 판정을 받는다 */
export const usePronunciationAnalysisMutation = (expressionId: number) =>
  useMutation({
    mutationFn: (recording: SentenceRecording) =>
      postPronunciationAnalysis(
        expressionId,
        recording.blob,
        recording.filename,
      ),
  });
