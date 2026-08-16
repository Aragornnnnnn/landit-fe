// 편지함의 두 칸과 그 아래 주소들 — 어느 칸을 보고 있는지는 주소에 남긴다
// 라우트를 가르지 않고 쿼리로 둔 건, 칸을 옮겨도 같은 화면·같은 스크롤 자리이기 때문이다
import { MAILBOX_PATH } from '@/shared/lib/routes';

export type MailboxBox = 'received' | 'sent';

export const MAILBOX_BOXES: { box: MailboxBox; label: string }[] = [
  { box: 'received', label: '받은 편지' },
  { box: 'sent', label: '보낸 편지' },
];

// 받은 편지가 정본 — 주소에 값이 없거나 모르는 값이면 여기로 돌린다
export const readBoxParam = (searchParams: URLSearchParams): MailboxBox =>
  searchParams.get('box') === 'sent' ? 'sent' : 'received';

export const mailboxPath = (box: MailboxBox) =>
  box === 'sent' ? `${MAILBOX_PATH}?box=sent` : MAILBOX_PATH;

// 편지 한 통을 펼쳐 보는 주소. 받은·보낸 편지가 한 식별자 공간을 쓴다는 계약 초안에 기대고 있다
export const letterPath = (letterId: number) => `${MAILBOX_PATH}/${letterId}`;

export const MAILBOX_COMPOSE_PATH = `${MAILBOX_PATH}/compose`;
