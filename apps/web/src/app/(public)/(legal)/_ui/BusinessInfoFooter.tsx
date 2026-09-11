// 전자상거래법 10조가 요구하는 사업자 정보 표시 — 약관·처리방침 페이지 하단에 붙는다 (마이페이지 → 약관 링크로 닿는 순차 표시)

export type BusinessInfo = {
  name: string;
  representative: string;
  registrationNumber: string;
  address: string;
  email: string;
  hosting: string;
  // 아래 둘은 확보 전이라 null이면 줄을 숨긴다
  phone: string | null;
  mailOrderNumber: string | null;
};

export const BUSINESS_INFO: BusinessInfo = {
  name: '랜딧(Landit)',
  representative: '손예원',
  registrationNumber: '284-24-02238',
  address: '충청북도 청주시 상당구 무농정로 6, 1층 S25호',
  email: 'landitkorea@gmail.com',
  hosting: 'Vercel Inc.',
  phone: null,
  mailOrderNumber: null,
};

interface BusinessInfoFooterProps {
  info?: BusinessInfo;
}

export const BusinessInfoFooter = ({
  info = BUSINESS_INFO,
}: BusinessInfoFooterProps) => {
  const rows: Array<[string, string | null]> = [
    ['상호', info.name],
    ['대표자', info.representative],
    ['사업자등록번호', info.registrationNumber],
    ['통신판매업 신고번호', info.mailOrderNumber],
    ['주소', info.address],
    ['전화번호', info.phone],
    ['이메일', info.email],
    ['호스팅 서비스', info.hosting],
  ];

  return (
    <footer className="mt-6 px-1">
      <h2 className="text-xs font-semibold text-muted-foreground">
        사업자 정보
      </h2>
      <dl className="mt-2 space-y-1">
        {rows.map(([label, value]) =>
          value === null ? null : (
            <div key={label} className="flex gap-3 text-xs leading-5">
              <dt className="w-[104px] shrink-0 text-muted-foreground">
                {label}
              </dt>
              <dd className="text-foreground">{value}</dd>
            </div>
          ),
        )}
      </dl>
    </footer>
  );
};
