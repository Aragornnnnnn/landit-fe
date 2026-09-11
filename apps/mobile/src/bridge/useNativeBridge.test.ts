// 네이티브 브릿지의 갈림길 — 핸들러가 던진 예외를 삼키지 않고 보고하는지 검증
import type WebView from 'react-native-webview';

import { reportError } from '../monitoring/report';
import { useNativeBridge } from './useNativeBridge';

jest.mock('../monitoring/report', () => ({ reportError: jest.fn() }));

const webviewRef = { current: null as WebView | null };

const messageEvent = (message: object) =>
  ({ nativeEvent: { data: JSON.stringify(message) } }) as never;

// 핸들러는 마이크로태스크로 실행된다 — 결과를 보려면 큐를 비운다
const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useNativeBridge', () => {
  it('핸들러가 비동기로 실패하면 어떤 메시지였는지와 함께 보고한다', async () => {
    const error = new Error('SDK 실패');
    // 훅이지만 React 상태를 쓰지 않아 그냥 부른다
    const { onMessage } = useNativeBridge(webviewRef, {
      GET_OFFERINGS: () => Promise.reject(error),
    });

    onMessage(messageEvent({ type: 'GET_OFFERINGS' }));
    await flushMicrotasks();

    expect(reportError).toHaveBeenCalledWith(error, {
      messageType: 'GET_OFFERINGS',
    });
  });

  it('핸들러가 동기로 던져도 같은 길로 보고한다', async () => {
    const error = new Error('동기 실패');
    const { onMessage } = useNativeBridge(webviewRef, {
      EXIT_APP: () => {
        throw error;
      },
    });

    onMessage(messageEvent({ type: 'EXIT_APP' }));
    await flushMicrotasks();

    expect(reportError).toHaveBeenCalledWith(error, {
      messageType: 'EXIT_APP',
    });
  });
});
