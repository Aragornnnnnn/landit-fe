// 대화 요약 맨 위의 래디와 회색 말풍선 — 분석 안내와 총평이 같은 자리에 서도록 골격을 함께 쓴다
import { toPoseImage } from '../model/randi-pose';

export const RandiBubble = ({
  pose,
  children,
}: {
  pose: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={toPoseImage(pose)}
      alt=""
      className="size-20 shrink-0 object-contain"
    />
    {/* 첫 문장엔 닉네임이 들어갈 수 있고 길이 제한이 없다 — 띄어쓰기 없는 긴 글자도 말풍선 안에서 꺾는다 */}
    <div className="min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-15 leading-6 font-bold [overflow-wrap:anywhere] break-keep text-foreground">
      {children}
    </div>
  </div>
);
