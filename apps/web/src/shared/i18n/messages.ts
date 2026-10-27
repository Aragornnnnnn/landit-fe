// 언어별 문구를 합치고 고르는 규칙 — 번역이 아직 없는 문구는 한국어로 채우고, 브라우저엔 필요한 묶음만 보낸다
type MessageTree = { [key: string]: string | MessageTree };

const isGroup = (value: unknown): value is MessageTree =>
  typeof value === 'object' && value !== null;

/**
 * 기본 문구 위에 다른 언어 문구를 덮는다. 덮는 쪽에 없는 키는 기본 쪽이 남아, 옮기는 중에도 빈 문구가 안 생긴다.
 */
export const mergeMessages = (
  base: MessageTree,
  override: MessageTree,
): MessageTree =>
  Object.fromEntries(
    Object.entries(base).map(([key, value]) => {
      const next = override[key];
      if (isGroup(value) && isGroup(next)) {
        return [key, mergeMessages(value, next)];
      }
      return [key, next ?? value];
    }),
  );

/**
 * 브라우저로 보낼 묶음만 고른다. common은 어느 화면이든 쓰므로 늘 같이 보낸다.
 *
 * @param namespaces 그 화면이 쓰는 네임스페이스 (예: `['paywall']`)
 */
export const pickMessages = <M extends { common: unknown }>(
  messages: M,
  namespaces: readonly (keyof M & string)[],
): Partial<M> =>
  Object.fromEntries(
    ['common', ...namespaces].map((namespace) => [
      namespace,
      messages[namespace as keyof M],
    ]),
  ) as Partial<M>;
