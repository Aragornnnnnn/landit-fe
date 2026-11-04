// 다음 장이 없을 때까지 받아 이어 붙인다 — 롤플레이 목록 API는 한 장이 최대 50개다
export const fetchAllPages = async <T>(
  getPage: (page: number) => Promise<{ items: T[]; hasNext: boolean }>,
) => {
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const received = await getPage(page);
    items.push(...received.items);
    if (!received.hasNext) return items;
  }
};
