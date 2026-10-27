// 최장 연속과 누적 학습일 — 스트릭이 끊겨도 이 둘은 남는다는 걸 조용히 말해 두는 한 줄
// 카드로 세우지 않는다. 이 화면의 주인공은 달력이고, 카드를 그 위에 놓으면 달력이 화면 밖으로 밀린다
import { useTranslations } from 'next-intl';

interface StreakStatsProps {
  longestStreakDays: number;
  totalActiveDays: number;
}

export const StreakStats = ({
  longestStreakDays,
  totalActiveDays,
}: StreakStatsProps) => {
  const t = useTranslations('streak.streakStats');
  // 기록이 없으면 아예 안 보여준다 — "가장 길게 0일"은 알려 줄 것도 없이 기죽이기만 한다
  if (totalActiveDays === 0) return null;

  return (
    <p className="px-5 text-center text-13 text-muted-foreground">
      {t.rich('recordDescription', {
        longest: longestStreakDays,
        total: totalActiveDays,
        strong: (chunks) => (
          <strong className="font-bold text-foreground">{chunks}</strong>
        ),
      })}
    </p>
  );
};
