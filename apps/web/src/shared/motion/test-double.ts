// 테스트용 motion/react 대역 — 중첩된 react 복사본이 렌더러 아이덴티티를 갈라놔서 순수 DOM으로 치환한다.
// 쓰는 쪽에서 vi.mock('motion/react', () => import('@/shared/motion/test-double'))로 통째로 넘긴다
import { createElement, forwardRef, Fragment } from 'react';

// 걷어낼 연출 전용 프롭 — DOM에 그대로 흘리면 React가 알 수 없는 속성이라고 경고한다
const MOTION_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'whileTap',
  'whileHover',
  'whileInView',
  'layout',
  'variants',
]);

// 태그별로 한 번만 만들어 재사용한다 — 접근할 때마다 새로 만들면 렌더마다 컴포넌트 타입이 바뀌어
// React가 diff 대신 언마운트·재마운트를 한다 (ref가 새 노드로 갈아끼워져 포커스 검증이 깨진다)
const cache = new Map<string, React.ComponentType>();

// forwardRef로 만들어야 쓰는 쪽의 ref(포커스 관리 등)가 실제 DOM 노드를 잡는다
const stripMotionProps = (tag: string) => {
  const Rendered = forwardRef(
    (
      { children, ...props }: Record<string, unknown>,
      ref: React.Ref<unknown>,
    ) =>
      createElement(
        tag,
        {
          ref,
          ...Object.fromEntries(
            Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
          ),
        },
        children as React.ReactNode,
      ),
  );
  Rendered.displayName = `motion.${tag}`;
  return Rendered as React.ComponentType;
};

export const motion = new Proxy({} as Record<string, React.ComponentType>, {
  get: (_target, tag: string) => {
    const cached = cache.get(tag);
    if (cached) return cached;

    const created = stripMotionProps(tag);
    cache.set(tag, created);
    return created;
  },
});

export const AnimatePresence = ({ children }: { children: React.ReactNode }) =>
  createElement(Fragment, null, children);

// 연출을 끈 사람 기준으로 돌린다 — 테스트에서 확인할 것은 배치와 동작이지 움직임이 아니다
export const useReducedMotion = () => true;
