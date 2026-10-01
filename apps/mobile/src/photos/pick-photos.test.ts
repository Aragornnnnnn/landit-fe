// 사진 보관함 고르기 — 취소·일부 실패·넘침·축소 기준을 웹에 돌려줄 결과로 옮기는지 확인한다
import * as ImagePicker from 'expo-image-picker';

import { reportError } from '../monitoring/report';
import { MAX_PHOTO_BYTES, pickPhotos } from './pick-photos';

const mockResize = jest.fn();
const mockSaveAsync = jest.fn();

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => {
      const context = {
        resize: (size: unknown) => {
          mockResize(size);
          return context;
        },
        renderAsync: () => Promise.resolve({ saveAsync: mockSaveAsync }),
      };
      return context;
    },
  },
}));
jest.mock('../monitoring/report', () => ({ reportError: jest.fn() }));

const launch = jest.mocked(ImagePicker.launchImageLibraryAsync);
const asset = (uri: string, width = 1000, height = 800) =>
  ({ uri, width, height }) as ImagePicker.ImagePickerAsset;

beforeEach(() => {
  mockSaveAsync.mockResolvedValue({ base64: 'BASE64' });
});

describe('pickPhotos', () => {
  it('사용자가 선택창을 닫으면 cancelled를 돌려준다', async () => {
    launch.mockResolvedValue({ canceled: true, assets: null });

    await expect(pickPhotos(3)).resolves.toEqual({
      status: 'cancelled',
      photos: [],
      failedCount: 0,
      overflowed: false,
    });
  });

  it('긴 변이 한도를 넘으면 긴 쪽을 한도에 맞춰 줄인다', async () => {
    launch.mockResolvedValue({
      canceled: false,
      assets: [asset('tall', 3024, 4032)],
    });

    await pickPhotos(1);

    expect(mockResize).toHaveBeenCalledWith({ height: 2048 });
  });

  it('한 장을 못 구우면 그 장만 빼고 나머지를 돌려준다', async () => {
    launch.mockResolvedValue({
      canceled: false,
      assets: [asset('a'), asset('b')],
    });
    mockSaveAsync
      .mockRejectedValueOnce(new Error('decode failed'))
      .mockResolvedValueOnce({ base64: 'B' });

    const result = await pickPhotos(3);

    expect(result).toEqual({
      status: 'success',
      photos: [{ base64: 'B', mimeType: 'image/jpeg' }],
      failedCount: 1,
      overflowed: false,
    });
    expect(reportError).toHaveBeenCalled();
  });

  it('한 장도 못 구우면 error를 돌려준다', async () => {
    launch.mockResolvedValue({ canceled: false, assets: [asset('a')] });
    mockSaveAsync.mockRejectedValue(new Error('decode failed'));

    await expect(pickPhotos(3)).resolves.toEqual({
      status: 'error',
      photos: [],
      failedCount: 1,
      overflowed: false,
    });
  });

  it('요청한 장수보다 많이 오면 앞에서부터 자른다', async () => {
    launch.mockResolvedValue({
      canceled: false,
      assets: [asset('a'), asset('b'), asset('c')],
    });

    const result = await pickPhotos(2);

    expect(result.photos).toHaveLength(2);
    expect(result.overflowed).toBe(true);
  });

  it('선택창을 못 열면 error를 돌려준다', async () => {
    launch.mockRejectedValue(new Error('no activity'));

    await expect(pickPhotos(3)).resolves.toEqual({
      status: 'error',
      photos: [],
      failedCount: 0,
      overflowed: false,
    });
  });

  it('장당 한도를 넘으면 해상도를 낮춰 한 번 더 굽는다', async () => {
    // given — 첫 굽기는 한도를 넘고 두 번째는 안에 든다 (base64 4글자 = 3바이트)
    launch.mockResolvedValue({
      canceled: false,
      assets: [asset('wide', 4032, 3024)],
    });
    mockSaveAsync
      .mockResolvedValueOnce({ base64: 'A'.repeat(MAX_PHOTO_BYTES * 2) })
      .mockResolvedValueOnce({ base64: 'SMALL' });

    const result = await pickPhotos(1);

    expect(mockResize.mock.calls).toEqual([
      [{ width: 2048 }],
      [{ width: 1600 }],
    ]);
    expect(result.photos).toEqual([
      { base64: 'SMALL', mimeType: 'image/jpeg' },
    ]);
  });
});
