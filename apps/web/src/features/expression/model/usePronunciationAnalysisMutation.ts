// 발음 분석 요청 배선
import { useMutation } from '@tanstack/react-query';

import { postPronunciationAnalysis } from '../api/pronunciation';
import type { SentenceRecording } from '../lib/sentence-recording';
import { toAnalysisRecording } from '../lib/word-playback';

/** 발음 분석 요청 mutation — 녹음(blob·파일명)을 올리고 점수·단어별 판정을 받는다 */
export const usePronunciationAnalysisMutation = (expressionId: number) =>
  useMutation({
    mutationFn: async (recording: SentenceRecording) => {
      const playback = await toAnalysisRecording(recording);
      const analysis = await postPronunciationAnalysis(
        expressionId,
        playback.blob,
        playback.filename,
      );
      return { analysis, playback };
    },
  });
