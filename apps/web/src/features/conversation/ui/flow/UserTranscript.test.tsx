// UserTranscript — 듣는 중 정지 안내 문구가 실제 발화 텍스트와 자리를 바꾸는지 검증한다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { UserTranscript } from './UserTranscript';

afterEach(cleanup);

describe('UserTranscript 정지 안내 문구', () => {
  it('듣는 중이고 아직 아무 말도 안 했으면 정지 안내 문구를 보여준다', () => {
    // given: 마이크를 켰지만 아직 발화 텍스트가 없는 상태
    render(<UserTranscript text="" phase="USER_SPEAKING" />);

    // then: 정지 버튼을 눌러야 한다는 안내가 보인다
    expect(
      screen.getByText('문장을 다 말했으면 정지 버튼을 눌러주세요'),
    ).toBeInTheDocument();
  });

  it('듣는 중 발화 텍스트가 생기면 안내 문구 대신 인식된 텍스트를 보여준다', () => {
    // given: 발화가 인식되어 텍스트가 채워진 상태
    render(<UserTranscript text="안녕하세요" phase="USER_SPEAKING" />);

    // then: 인식된 텍스트가 보이고, 안내 문구는 사라진다
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    expect(
      screen.queryByText('문장을 다 말했으면 정지 버튼을 눌러주세요'),
    ).not.toBeInTheDocument();
  });

  it('듣는 중이 아니면 텍스트가 비어 있어도 안내 문구를 보여주지 않는다', () => {
    // given: 아직 말하기 전(대기) 단계
    render(<UserTranscript text="" phase="USER_READY" />);

    // then: 정지 안내 문구가 없다
    expect(
      screen.queryByText('문장을 다 말했으면 정지 버튼을 눌러주세요'),
    ).not.toBeInTheDocument();
  });
});
