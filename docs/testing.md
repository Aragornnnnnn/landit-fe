# 테스트 작성 규칙

테스트 도구는 web이 Vitest, mobile이 Jest(jest-expo)지만 쓰는 방법은 같다. 아래 예시는 Vitest 기준이고, 모바일에선 `vi.`를 `jest.`로 바꿔 읽으면 된다.

기본은 TDD다. 새 로직과 버그 수정은 테스트를 먼저 쓰고, 그걸 통과시키며 구현한다. 다만 3번처럼 갈림길 없는 코드까지 억지로 테스트하지는 않는다 — 테스트할 가치가 있는 곳에서 먼저 쓴다.

## 요약

1. Given(준비) → When(실행) → Then(검증) 순서로 쓰고, 단락은 빈 줄로 나눈다.
2. 테스트 이름은 한국어로 "~하면 ~한다".
3. 갈림길(if·에러 처리·폴백)이 있는 코드만 테스트한다. 넘겨주기만 하는 코드는 안 쓴다.
4. 화면은 모양이 아니라 동작을 확인한다. 스냅샷 테스트 금지.
5. 목(가짜 객체)은 경계만 — 네트워크·네이티브 SDK·시간. 우리 코드는 실물로 돌린다.
6. 버그를 고칠 땐 재현하는 테스트부터 쓰고, 그걸 통과시켜 수정을 증명한다.
7. 테스트 파일은 소스 옆에 둔다 (`foo.ts` 옆 `foo.test.ts`). 전체 실행은 루트에서 `pnpm test`.

## 기본 모양 — Given / When / Then

```ts
it('실패 응답이면 서버가 준 메시지로 에러를 던진다', async () => {
  // given — 서버가 실패 응답을 내려준 상황
  const response = fakeResponse({
    success: false,
    error: { message: '검증 값이 일치하지 않습니다.' },
  });

  // when + then — 파싱하면 그 메시지로 던진다
  await expect(parseApiResponse(response)).rejects.toThrow(
    '검증 값이 일치하지 않습니다.',
  );
});
```

- 이름만 읽어도 뭘 검증하는지 보여야 한다. `it('parse test')` 금지.
- 단락이 자명하면 주석 없이 빈 줄만으로 충분하다.
- 한 테스트에 when-then 사이클은 하나만. 두 번째가 생기면 테스트를 쪼갠다.

## 뭘 테스트하고, 뭘 건너뛰나

테스트할 가치 = 갈림길이 있는가.

```ts
// 건너뛴다 — 위임만 하는 코드. 확인할 게 "목을 불렀는가"뿐인 빈 테스트가 된다
it('getUser는 repo.find를 호출한다', () => { ... });

// 테스트한다 — "없으면 게스트"라는 갈림길이 있다
it('사용자가 없으면 게스트로 폴백한다', () => {
  const repo = { find: () => null };

  const user = getUserOrGuest(repo, 1);

  expect(user.role).toBe('guest');
});
```

겉으로 안 드러나는 약속도 테스트로 남긴다 — 예를 들어 "옛 버전 앱이 보내는 옛 형식 메시지도 계속 받아줘야 한다" 같은 것. 누가 실수로 깨도 화면엔 안 보이니, 테스트가 대신 지켜본다.

## 화면(UI) 테스트

사용자가 하는 방식으로 조작하고, 결과 동작만 확인한다.

```ts
// 나쁨 — 마크업·클래스 검사. 디자인만 바뀌어도 깨진다
expect(container.querySelector('.btn-primary')).toBeInTheDocument();

// 좋음 — 사용자처럼 찾아서 누르고, 동작을 확인한다
await userEvent.click(screen.getByRole('button', { name: '제출' }));
expect(onSubmit).toHaveBeenCalledWith('I love you');
```

- 요소는 사용자가 인식하는 방식으로 찾는다 — `getByRole`, `getByText`. `getByTestId`는 최후 수단.
- "안 보인다"는 `queryBy...`로 확인한다 — `expect(screen.queryByText('탈퇴')).not.toBeInTheDocument()`.

## 목킹

- **경계만 목한다** — fetch, 네이티브 SDK, 시간. 우리 내부 모듈까지 목하면 실제 로직은 하나도 안 돌고 목끼리 대화하는 테스트가 된다. 목이 3개 이상 필요하면 설계를 의심한다.
- **목은 매 테스트 자동 초기화된다** — web(vitest.config.ts)·mobile(jest 설정)에 켜져 있다. 앞 테스트의 목이 뒤 테스트로 새서 "혼자 돌리면 통과, 전체 돌리면 실패"가 되는 사고를 막는다.
- **시간은 fake timer로** — 진짜로 기다리면 느리고 가끔 깨진다. `vi.useFakeTimers()` 켜고 `vi.advanceTimersByTime(3000)`으로 시간만 흘려보낸 뒤, `afterEach(() => vi.useRealTimers())`로 되돌린다.
- **입력만 다른 같은 흐름은 `it.each` 표로 묶는다** — 표 한 줄이 케이스 하나. 포맷 문자열(`%s`)에는 문자열 컬럼만 쓴다.

```ts
it.each([
  ['invalid_grant', '만료된 인증입니다.'],
  ['id_token_missing', 'id_token이 없습니다.'],
])('%s 코드면 "%s" 에러를 던진다', (code, message) => {
  expect(() => mapAuthError(code)).toThrow(message);
});
```
