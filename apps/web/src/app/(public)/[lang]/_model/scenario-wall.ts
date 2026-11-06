// 랜딩 시나리오 벽의 카드 — 운영 시나리오 100장의 제목과 그림 그대로다. 제목은 서버가 주는 시나리오 글을 옮겨 둔 것이라 화면 문구 파일이 아니라 여기 언어별로 둔다(docs/i18n.md 7번).
// 일본어 제목이 없는 카드는 한국에만 맞는 상황(한식당·한국 라면·한국 날씨·한국으로 소포)이라 일본어 화면에선 그림만 보인다
import type { Locale } from '@/shared/i18n/locale';

type WallCard = {
  title: { ko: string } & Partial<Record<Locale, string>>;
  image: string;
};

export const WALL_SCENARIOS: WallCard[] = [
  {
    title: {
      ko: '입주 첫날, 룸메이트 Marco와 첫 만남',
      ja: '入居初日、ルームメイトのマルコと初対面',
    },
    image: '/images/landing/scenarios/s-01.webp',
  },
  {
    title: {
      ko: '카페 수다 — 주말 약속 잡기',
      ja: 'カフェでおしゃべり — 週末の約束',
    },
    image: '/images/landing/scenarios/s-03.webp',
  },
  {
    title: { ko: '유심과 요금제 구매하기', ja: 'SIMと料金プランを買う' },
    image: '/images/landing/scenarios/s-40.webp',
  },
  {
    title: { ko: '카페에서 주문하기', ja: 'カフェで注文する' },
    image: '/images/landing/scenarios/s-17.webp',
  },
  {
    title: {
      ko: '인터내셔널 파티 — 처음 만난 Chloe',
      ja: 'インターナショナルパーティー — 初対面のクロエ',
    },
    image: '/images/landing/scenarios/s-06.webp',
  },
  {
    title: {
      ko: '방 키를 잃어버려 임시 출입 요청하기',
      ja: '部屋の鍵をなくして仮の入館を頼む',
    },
    image: '/images/landing/scenarios/s-21.webp',
  },
  {
    title: {
      ko: '마음에 안 드는 사람 정중히 거절하기',
      ja: '苦手な相手を丁寧に断る',
    },
    image: '/images/landing/scenarios/s-16.webp',
  },
  {
    title: { ko: '첫 수업, 옆자리 Marco', ja: '初めての授業、隣の席のマルコ' },
    image: '/images/landing/scenarios/s-08.webp',
  },
  {
    title: {
      ko: '식료품점에서 대체 재료 찾기',
      ja: '食料品店で代わりの材料を探す',
    },
    image: '/images/landing/scenarios/s-34.webp',
  },
  {
    title: { ko: '친구와 여행 수다 떨기', ja: '友だちと旅行の話をする' },
    image: '/images/landing/scenarios/s-20.webp',
  },
  {
    title: {
      ko: '세탁물이 뒤섞인 문제 해결하기',
      ja: '混ざった洗濯物のトラブルを解決する',
    },
    image: '/images/landing/scenarios/s-23.webp',
  },
  {
    title: { ko: '시험 공부 수다', ja: '試験勉強のおしゃべり' },
    image: '/images/landing/scenarios/s-11.webp',
  },
  {
    title: { ko: '결석한 수업 노트 부탁하기', ja: '休んだ授業のノートを頼む' },
    image: '/images/landing/scenarios/s-32.webp',
  },
  {
    title: { ko: '소음, 손님, 경계 정하기', ja: '騒音や来客の線引きを決める' },
    image: '/images/landing/scenarios/s-05.webp',
  },
  {
    title: {
      ko: '공용 냉장고 공간 정리하기',
      ja: '共用冷蔵庫のスペースを整理する',
    },
    image: '/images/landing/scenarios/s-22.webp',
  },
  {
    title: { ko: '집안일과 생활 규칙 정하기', ja: '家事と生活ルールを決める' },
    image: '/images/landing/scenarios/s-02.webp',
  },
  {
    title: {
      ko: '세면대 누수 수리 요청하기',
      ja: '洗面台の水漏れの修理を頼む',
    },
    image: '/images/landing/scenarios/s-24.webp',
  },
  {
    title: { ko: '조별 발표 준비하기', ja: 'グループ発表の準備をする' },
    image: '/images/landing/scenarios/s-09.webp',
  },
  {
    title: {
      ko: '과제 제출 방식 선택하고 준비하기',
      ja: '課題の提出方法を選んで準備する',
    },
    image: '/images/landing/scenarios/s-33.webp',
  },
  {
    title: {
      ko: '수강 과목을 지도교수와 상담하기',
      ja: '履修科目を指導教員に相談する',
    },
    image: '/images/landing/scenarios/s-31.webp',
  },
  {
    title: { ko: '상황에 맞는 옷 추천받기', ja: '場面に合う服を選んでもらう' },
    image: '/images/landing/scenarios/s-35.webp',
  },
  {
    title: {
      ko: '토론 수업 — 돈과 행복',
      ja: 'ディスカッション授業 — お金と幸せ',
    },
    image: '/images/landing/scenarios/s-12.webp',
  },
  {
    title: {
      ko: '기능과 가격을 비교해 헤드폰 고르기',
      ja: '機能と価格を比べてヘッドホンを選ぶ',
    },
    image: '/images/landing/scenarios/s-37.webp',
  },
  {
    title: {
      ko: '불량 상품 교환 또는 환불 요청하기',
      ja: '不良品の交換か返金を頼む',
    },
    image: '/images/landing/scenarios/s-39.webp',
  },
  {
    title: {
      ko: '중고 자전거 상태 확인하고 가격 협상하기',
      ja: '中古自転車の状態を見て値段交渉する',
    },
    image: '/images/landing/scenarios/s-38.webp',
  },
  {
    title: {
      ko: '일정에 맞는 기차표 구매하기',
      ja: '予定に合う電車の切符を買う',
    },
    image: '/images/landing/scenarios/s-26.webp',
  },
  {
    title: { ko: '비행기 옆자리 승객과의 대화', ja: '飛行機で隣の乗客と話す' },
    image: '/images/landing/scenarios/s-13.webp',
  },
  {
    title: { ko: '호텔 체크인 하기', ja: 'ホテルにチェックインする' },
    image: '/images/landing/scenarios/s-15.webp',
  },
  {
    title: {
      ko: '여행 일정에 맞는 박물관 패스 고르기',
      ja: '旅程に合う博物館パスを選ぶ',
    },
    image: '/images/landing/scenarios/s-28.webp',
  },
  {
    title: {
      ko: '식당에서 메뉴 비교하고 주문하기',
      ja: 'レストランでメニューを比べて注文する',
    },
    image: '/images/landing/scenarios/s-27.webp',
  },
  {
    title: {
      ko: '길 잃고 현지인에게 길 묻기',
      ja: '道に迷って地元の人に道を聞く',
    },
    image: '/images/landing/scenarios/s-19.webp',
  },
  {
    title: {
      ko: '날씨 때문에 야외 투어 일정 변경하기',
      ja: '天気のせいで屋外ツアーの日程を変える',
    },
    image: '/images/landing/scenarios/s-29.webp',
  },
  {
    title: {
      ko: '약국에서 증상 설명하고 약 사기',
      ja: '薬局で症状を伝えて薬を買う',
    },
    image: '/images/landing/scenarios/s-18.webp',
  },
  {
    title: {
      ko: '가격과 특징을 비교해 선물 고르기',
      ja: '価格と特徴を比べてプレゼントを選ぶ',
    },
    image: '/images/landing/scenarios/s-36.webp',
  },
  {
    title: {
      ko: '공항에서 더 편한 좌석으로 변경하기',
      ja: '空港でもっと楽な席に変える',
    },
    image: '/images/landing/scenarios/s-30.webp',
  },
  {
    title: {
      ko: '수하물 파손 — 카운터에 항의하기',
      ja: '荷物の破損 — カウンターで抗議する',
    },
    image: '/images/landing/scenarios/s-14.webp',
  },
  {
    title: { ko: '교수님 오피스아워 방문', ja: '教授のオフィスアワーを訪ねる' },
    image: '/images/landing/scenarios/s-10.webp',
  },
  {
    title: {
      ko: '기숙사 에어컨 요금 문제 — 프론트에 전화하기',
      ja: '寮のエアコン料金の問題 — フロントに電話する',
    },
    image: '/images/landing/scenarios/s-04.webp',
  },
  {
    title: { ko: '서로 더 알아가는 밤', ja: 'お互いをもっと知る夜' },
    image: '/images/landing/scenarios/s-07.webp',
  },
  {
    title: { ko: '퇴실 점검과 보증금 확인하기', ja: '退去点検と敷金の確認' },
    image: '/images/landing/scenarios/s-25.webp',
  },
  {
    title: { ko: '한식당에서 Chloe 메뉴 골라주기' },
    image: '/images/landing/scenarios/s-41.webp',
  },
  {
    title: {
      ko: 'Marco에게 택배 대신 받아 달라고 부탁하기',
      ja: 'マルコに荷物の受け取りを頼む',
    },
    image: '/images/landing/scenarios/s-42.webp',
  },
  {
    title: { ko: '영화관에서 티켓 사기', ja: '映画館でチケットを買う' },
    image: '/images/landing/scenarios/s-43.webp',
  },
  {
    title: {
      ko: '동아리 부스에서 가입 권유 받기',
      ja: 'サークルのブースで勧誘される',
    },
    image: '/images/landing/scenarios/s-44.webp',
  },
  {
    title: {
      ko: 'Marco와 같이 할 운동 정하기',
      ja: 'マルコと一緒にするスポーツを決める',
    },
    image: '/images/landing/scenarios/s-45.webp',
  },
  {
    title: {
      ko: '역에서 여행 가방 맡길 방법 찾기',
      ja: '駅でスーツケースを預ける方法を探す',
    },
    image: '/images/landing/scenarios/s-46.webp',
  },
  {
    title: {
      ko: 'Marco 몰래 생일 파티 준비하기',
      ja: 'マルコに内緒で誕生日パーティーを準備する',
    },
    image: '/images/landing/scenarios/s-47.webp',
  },
  {
    title: {
      ko: 'Marco와 피크닉 계획 세우기',
      ja: 'マルコとピクニックの計画を立てる',
    },
    image: '/images/landing/scenarios/s-48.webp',
  },
  {
    title: { ko: '펍에서 첫 주문하기', ja: 'パブで初めて注文する' },
    image: '/images/landing/scenarios/s-49.webp',
  },
  {
    title: {
      ko: '시험 망친 Chloe 위로하기',
      ja: '試験に失敗したクロエを励ます',
    },
    image: '/images/landing/scenarios/s-50.webp',
  },
  {
    title: {
      ko: '마트 셀프 계산대 오류 해결하기',
      ja: 'スーパーのセルフレジのエラーを解決する',
    },
    image: '/images/landing/scenarios/s-51.webp',
  },
  {
    title: {
      ko: 'Marco와 교내 프린터 오류 해결하기',
      ja: 'マルコと学内プリンターのエラーを解決する',
    },
    image: '/images/landing/scenarios/s-52.webp',
  },
  {
    title: {
      ko: '티룸에서 애프터눈 티 즐기기',
      ja: 'ティールームでアフタヌーンティーを楽しむ',
    },
    image: '/images/landing/scenarios/s-53.webp',
  },
  {
    title: {
      ko: 'Chloe와 방학 여행 계획 짜기',
      ja: 'クロエと休みの旅行を計画する',
    },
    image: '/images/landing/scenarios/s-54.webp',
  },
  {
    title: {
      ko: '병원 전화 예약하고 증상 말하기',
      ja: '病院に電話で予約して症状を伝える',
    },
    image: '/images/landing/scenarios/s-55.webp',
  },
  {
    title: {
      ko: 'Marco와 잘못 배달된 음식 주문 해결하기',
      ja: 'マルコと誤配達された料理の注文を解決する',
    },
    image: '/images/landing/scenarios/s-56.webp',
  },
  {
    title: { ko: '축구 경기 직관하기', ja: 'サッカーの試合をスタジアムで観る' },
    image: '/images/landing/scenarios/s-57.webp',
  },
  {
    title: { ko: '빌려준 책 돌려받기', ja: '貸した本を返してもらう' },
    image: '/images/landing/scenarios/s-58.webp',
  },
  {
    title: {
      ko: '할인 쿠폰이 적용되지 않아 확인 요청하기',
      ja: '割引クーポンが使えず確認を頼む',
    },
    image: '/images/landing/scenarios/s-59.webp',
  },
  {
    title: {
      ko: 'Marco와 사진 과제 촬영 계획 세우기',
      ja: 'マルコと写真課題の撮影を計画する',
    },
    image: '/images/landing/scenarios/s-60.webp',
  },
  {
    title: { ko: '미용실에서 머리 자르기', ja: '美容院で髪を切る' },
    image: '/images/landing/scenarios/s-61.webp',
  },
  {
    title: {
      ko: 'Marco와 잃어버린 휴대폰 찾기',
      ja: 'マルコとなくしたスマホを探す',
    },
    image: '/images/landing/scenarios/s-62.webp',
  },
  {
    title: { ko: '펍 퀴즈에 합류하기', ja: 'パブクイズに参加する' },
    image: '/images/landing/scenarios/s-63.webp',
  },
  {
    title: {
      ko: 'Chloe의 코첼라 제안에 답하기',
      ja: 'クロエのコーチェラの誘いに答える',
    },
    image: '/images/landing/scenarios/s-64.webp',
  },
  {
    title: {
      ko: '교내 카페 아르바이트 면접 보기',
      ja: '学内カフェのアルバイト面接を受ける',
    },
    image: '/images/landing/scenarios/s-65.webp',
  },
  {
    title: {
      ko: '국립공원에서 하이킹 코스 추천받기',
      ja: '国立公園でハイキングコースを教えてもらう',
    },
    image: '/images/landing/scenarios/s-66.webp',
  },
  {
    title: { ko: '은행 계좌 개설하기', ja: '銀行口座を開設する' },
    image: '/images/landing/scenarios/s-67.webp',
  },
  {
    title: { ko: '우체국에서 한국으로 소포 보내기' },
    image: '/images/landing/scenarios/s-68.webp',
  },
  {
    title: {
      ko: '지하철 개찰구 요금 문제 해결하기',
      ja: '地下鉄の改札で運賃のトラブルを解決する',
    },
    image: '/images/landing/scenarios/s-69.webp',
  },
  {
    title: {
      ko: '항공권 영문 이름 오류 수정 요청하기',
      ja: '航空券の英語名の誤りを直してもらう',
    },
    image: '/images/landing/scenarios/s-70.webp',
  },
  {
    title: {
      ko: '인간관계 고민하는 Chloe 이야기 들어 주기',
      ja: '人間関係に悩むクロエの話を聞く',
    },
    image: '/images/landing/scenarios/s-71.webp',
  },
  {
    title: {
      ko: 'Chloe와 오늘 밤 볼 넷플릭스 고르기',
      ja: 'クロエと今夜観るNetflixを選ぶ',
    },
    image: '/images/landing/scenarios/s-72.webp',
  },
  {
    title: {
      ko: '샌드위치 가게에서 내 맘대로 주문하기',
      ja: 'サンドイッチ店で好きなように注文する',
    },
    image: '/images/landing/scenarios/s-73.webp',
  },
  {
    title: {
      ko: '도서관 스터디룸 예약하기',
      ja: '図書館のスタディルームを予約する',
    },
    image: '/images/landing/scenarios/s-74.webp',
  },
  {
    title: {
      ko: 'Chloe에게 내가 사는 집 이야기하기',
      ja: 'クロエに自分の住む家の話をする',
    },
    image: '/images/landing/scenarios/s-75.webp',
  },
  {
    title: {
      ko: '호텔 방 에어컨 고장으로 방 바꾸기',
      ja: 'ホテルのエアコンが壊れて部屋を替えてもらう',
    },
    image: '/images/landing/scenarios/s-76.webp',
  },
  {
    title: { ko: 'Marco에게 한국 라면 끓여주기' },
    image: '/images/landing/scenarios/s-77.webp',
  },
  {
    title: {
      ko: '구독 서비스 해지 전화하기',
      ja: 'サブスクの解約を電話で伝える',
    },
    image: '/images/landing/scenarios/s-78.webp',
  },
  {
    title: { ko: '전화로 식당 예약하기', ja: '電話でレストランを予約する' },
    image: '/images/landing/scenarios/s-79.webp',
  },
  {
    title: {
      ko: '조별 과제 안 하는 팀원에게 말하기',
      ja: 'グループ課題をしないメンバーに伝える',
    },
    image: '/images/landing/scenarios/s-81.webp',
  },
  {
    title: {
      ko: '분실물 센터에서 지갑 찾기',
      ja: '遺失物センターで財布を探す',
    },
    image: '/images/landing/scenarios/s-82.webp',
  },
  {
    title: { ko: '수영 강습 등록하기', ja: '水泳教室に申し込む' },
    image: '/images/landing/scenarios/s-83.webp',
  },
  {
    title: {
      ko: 'Chloe와 단골 카페 이야기하기',
      ja: 'クロエと行きつけのカフェの話をする',
    },
    image: '/images/landing/scenarios/s-85.webp',
  },
  {
    title: {
      ko: '박물관 도슨트 투어 참여하기',
      ja: '博物館のガイドツアーに参加する',
    },
    image: '/images/landing/scenarios/s-86.webp',
  },
  {
    title: { ko: 'Marco의 강아지 맡아 주기', ja: 'マルコの犬を預かる' },
    image: '/images/landing/scenarios/s-87.webp',
  },
  {
    title: { ko: '휴대폰 액정 수리 맡기기', ja: 'スマホの画面修理を頼む' },
    image: '/images/landing/scenarios/s-88.webp',
  },
  {
    title: {
      ko: '학사과에 수강 정정 문의하기',
      ja: '教務課に履修変更を問い合わせる',
    },
    image: '/images/landing/scenarios/s-89.webp',
  },
  {
    title: { ko: 'Chloe에게 한국의 날씨와 계절 이야기하기' },
    image: '/images/landing/scenarios/s-90.webp',
  },
  {
    title: { ko: 'Chloe와 방 탈출 게임 하기', ja: 'クロエと脱出ゲームをする' },
    image: '/images/landing/scenarios/s-91.webp',
  },
  {
    title: { ko: '인턴십 면접 보기', ja: 'インターンシップの面接を受ける' },
    image: '/images/landing/scenarios/s-92.webp',
  },
  {
    title: { ko: '공항 입국 심사 받기', ja: '空港で入国審査を受ける' },
    image: '/images/landing/scenarios/s-93.webp',
  },
  {
    title: {
      ko: '도착하지 않은 온라인 주문 문의하기',
      ja: '届かないネット注文を問い合わせる',
    },
    image: '/images/landing/scenarios/s-94.webp',
  },
  {
    title: {
      ko: 'Chloe와 인생 영화 이야기하기',
      ja: 'クロエと人生の映画の話をする',
    },
    image: '/images/landing/scenarios/s-95.webp',
  },
  {
    title: {
      ko: '인턴 첫 출근, 동료 Teddy와 인사하기',
      ja: 'インターン初出勤、同僚のテディとあいさつ',
    },
    image: '/images/landing/scenarios/s-96.webp',
  },
  {
    title: {
      ko: '식당에서 덜 익은 음식 바꿔 달라고 하기',
      ja: 'レストランで生焼けの料理を替えてもらう',
    },
    image: '/images/landing/scenarios/s-97.webp',
  },
  {
    title: {
      ko: '약속에 늦어서 Chloe에게 사과하기',
      ja: '約束に遅れてクロエに謝る',
    },
    image: '/images/landing/scenarios/s-98.webp',
  },
  {
    title: {
      ko: '동료 Teddy와 점심 메뉴 정하기',
      ja: '同僚のテディとランチを決める',
    },
    image: '/images/landing/scenarios/s-99.webp',
  },
  {
    title: {
      ko: 'Marco의 새 취미에 대해 물어보기',
      ja: 'マルコの新しい趣味について聞く',
    },
    image: '/images/landing/scenarios/s-100.webp',
  },
];

/** 벽 가운데 놓이는 오늘의 시나리오 — 벽의 다른 칸에는 다시 나오지 않는다 */
export const TODAY_SCENARIO = WALL_SCENARIOS[0];

/** 친구 이름이 나오는 시나리오를 벽 전체에 고르게 흩어 곰 그림이 한쪽에 몰리지 않게 한다 */
const spreadEvenly = () => {
  const rest = WALL_SCENARIOS.slice(1);
  const isFriend = ({ title }: WallCard) => /Chloe|Marco/.test(title.ko);
  const ranked = (list: typeof rest) =>
    list.map((card, index) => ({ card, rank: (index + 0.5) / list.length }));
  return [
    ...ranked(rest.filter(isFriend)),
    ...ranked(rest.filter((card) => !isFriend(card))),
  ]
    .sort((a, b) => a.rank - b.rank)
    .map(({ card }) => card);
};

/** 모든 카드를 겹치지 않게 줄로 나눈다 */
export const buildWallRows = (rowCount: number, perRow: number) => {
  const cards = spreadEvenly();
  return Array.from({ length: rowCount }, (_, row) =>
    cards.slice(row * perRow, (row + 1) * perRow),
  );
};

/** 벽의 한 칸을 오늘의 시나리오로 뽑고, 그 칸에는 지금의 오늘 카드를 넣는다 — 맞바꾸므로 그림이 겹치지 않는다 */
export const pickToday = (rows: WallCard[][], random: number) => {
  const cards = rows.flat();
  const picked = Math.min(cards.length - 1, Math.floor(random * cards.length));
  const perRow = rows[0].length;
  const row = Math.floor(picked / perRow);
  const column = picked % perRow;
  return {
    today: rows[row][column],
    rows: rows.map((cells, rowIndex) =>
      rowIndex === row
        ? cells.map((cell, columnIndex) =>
            columnIndex === column ? TODAY_SCENARIO : cell,
          )
        : cells,
    ),
  };
};

const FOCUS_START = 0.2;
const FOCUS_END = 0.45;
/** 벽 진행도(0 화면 아래 → 1 화면 위로 다 지나감)를 오늘의 카드가 떠오른 정도(0~1)로 바꾼다 */
export const wallFocus = (progress: number) => {
  const focus = (progress - FOCUS_START) / (FOCUS_END - FOCUS_START);
  return Math.min(1, Math.max(0, Math.round(focus * 1000) / 1000));
};
