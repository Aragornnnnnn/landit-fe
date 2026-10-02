// 확대 보기 — 여는 법·닫는 법·배율 버튼 끝·여러 장 넘기기를 사용자 조작으로 확인한다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeTopSheet } from '@/shared/ui/bottom-sheet-back';

import { ImageViewer } from './ImageViewer';
import { ZoomableImage } from './ZoomableImage';

afterEach(cleanup);

const images = [
  { src: 'blob:1', alt: '첨부 사진 1' },
  { src: 'blob:2', alt: '첨부 사진 2' },
  { src: 'blob:3', alt: '첨부 사진 3' },
];

describe('ZoomableImage', () => {
  it('누르면 그 한 장을 몇 번째 표시 없이 크게 연다', () => {
    render(<ZoomableImage src="https://img.landit.im/a.png" alt="공지 그림" />);

    fireEvent.click(
      screen.getByRole('button', { name: '공지 그림 크게 보기' }),
    );

    expect(screen.getByRole('dialog', { name: '사진 크게 보기' })).toBeTruthy();
    expect(screen.queryByText('1 / 1')).toBeNull();
  });

  it('안드로이드 뒤로가기는 확대 보기만 닫는다', () => {
    render(<ZoomableImage src="https://img.landit.im/a.png" alt="공지 그림" />);
    fireEvent.click(
      screen.getByRole('button', { name: '공지 그림 크게 보기' }),
    );

    let consumed = false;
    act(() => {
      consumed = closeTopSheet();
    });

    expect(consumed).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ImageViewer', () => {
  it('여러 장이면 누른 사진부터 몇 번째인지 보여준다', () => {
    render(<ImageViewer images={images} startIndex={1} onClose={vi.fn()} />);

    expect(screen.getByText('2 / 3')).toBeTruthy();
  });

  it('처음엔 원래 크기라 축소를 누를 수 없다', () => {
    render(<ImageViewer images={images} startIndex={0} onClose={vi.fn()} />);

    expect(
      (screen.getByRole('button', { name: '축소' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('3배까지 키우면 확대를 더 누를 수 없다', () => {
    render(<ImageViewer images={images} startIndex={0} onClose={vi.fn()} />);
    const zoomIn = screen.getByRole('button', {
      name: '확대',
    }) as HTMLButtonElement;

    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);

    expect(zoomIn.disabled).toBe(true);
  });

  it('닫기를 누르면 닫는다', () => {
    const onClose = vi.fn();
    render(<ImageViewer images={images} startIndex={0} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('핀치 뒤 손가락을 하나씩 떼도 거의 원래 크기면 원래 크기로 맞춘다', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    render(<ImageViewer images={images} startIndex={0} onClose={vi.fn()} />);
    const photo = screen.getByAltText('첨부 사진 1');
    const frame = photo.parentElement!;

    fireEvent.pointerDown(frame, { pointerId: 1, clientX: 100, clientY: 400 });
    fireEvent.pointerDown(frame, { pointerId: 2, clientX: 200, clientY: 400 });
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 202, clientY: 400 });
    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 100, clientY: 400 });
    fireEvent.pointerUp(frame, { pointerId: 2, clientX: 202, clientY: 400 });

    expect(photo.style.transform).toContain('scale(1)');
  });

  it('키보드 방향키로 사진을 넘긴다', () => {
    render(<ImageViewer images={images} startIndex={0} onClose={vi.fn()} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowLeft' });

    expect(screen.getByText('2 / 3')).toBeTruthy();
  });

  it('스크린 리더용 이전·다음 버튼으로 넘기고, 끝에서는 그쪽 버튼을 막는다', () => {
    render(<ImageViewer images={images} startIndex={0} onClose={vi.fn()} />);
    const previous = screen.getByRole('button', {
      name: '이전 사진',
    }) as HTMLButtonElement;

    expect(previous.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '다음 사진' }));
    expect(screen.getByText('2 / 3')).toBeTruthy();
  });

  it('한 장이면 이전·다음 버튼을 두지 않는다', () => {
    render(
      <ImageViewer
        images={images.slice(0, 1)}
        startIndex={0}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: '다음 사진' })).toBeNull();
  });

  it('취소된 손가락 입력은 넘기기나 닫기로 받지 않는다', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    const onClose = vi.fn();
    render(<ImageViewer images={images} startIndex={0} onClose={onClose} />);
    const frame = screen.getByAltText('첨부 사진 1').parentElement!;

    fireEvent.pointerDown(frame, { pointerId: 1, clientX: 300, clientY: 400 });
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 100, clientY: 400 });
    fireEvent.pointerCancel(frame, {
      pointerId: 1,
      clientX: 100,
      clientY: 400,
    });
    fireEvent.pointerDown(frame, { pointerId: 2, clientX: 200, clientY: 300 });
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 200, clientY: 600 });
    fireEvent.pointerCancel(frame, {
      pointerId: 2,
      clientX: 200,
      clientY: 600,
    });

    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('사진을 불러오지 못하면 그 자리에 알려준다', () => {
    render(<ImageViewer images={images} startIndex={0} onClose={vi.fn()} />);

    fireEvent.error(screen.getByAltText('첨부 사진 1'));

    expect(screen.getByText('사진을 불러오지 못했어요')).toBeTruthy();
  });
});
