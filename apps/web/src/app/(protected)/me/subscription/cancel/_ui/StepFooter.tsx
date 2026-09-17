// 스텝 바닥 — 주 버튼 하나와 그 아래 13px 회색 링크 하나. 모든 스텝이 같은 자리·같은 크기로 끝난다
interface StepFooterProps {
  primary: React.ReactNode;
  link: React.ReactNode;
}

export const StepFooter = ({ primary, link }: StepFooterProps) => (
  <div className="shrink-0 px-5 pt-2 pb-8">
    {primary}
    <p className="mt-3.5 text-center text-[13px] text-muted-foreground">
      {link}
    </p>
  </div>
);
