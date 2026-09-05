// 남은 스텝을 알려주는 진행점 — 온보딩·위젯 설치 안내 등 여러 스텝 흐름이 공용으로 쓴다
'use client';

export const StepDots = <Step extends string>({
  step,
  stepOrder,
}: {
  step: Step;
  stepOrder: readonly Step[];
}) => {
  const stepIndex = stepOrder.indexOf(step);

  return (
    <div className="flex items-center gap-1.5">
      {stepOrder.map((item, index) => (
        <span
          key={item}
          className={`h-1.5 rounded-full transition-all duration-300 ${index <= stepIndex ? 'bg-foreground' : 'bg-border'}`}
          style={{
            width: index === stepIndex ? 18 : 6,
            opacity: index === stepIndex ? 0.95 : 0.6,
          }}
        />
      ))}
    </div>
  );
};
