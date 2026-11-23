# 대화 상대 표정 원본 (Rive)

대화 캐릭터(클로이·마르코·테디)의 표정 8종 원본이다. 앱은 Rive를 쓰지 않고, 여기서 뽑은
`src/features/conversation/ui/character/expressions/*.json`을 재생한다.

- `<캐릭터>/scene.rml` — Rive 장면. 직접 고치지 말고 아래 스크립트로 다시 만든다
- `_source/*.svg`, `_source/*.base.rml` — 원본 파츠 그림과 그걸 Rive로 옮긴 첫 장면
- `_source/tools/` — 리그(rig2.py)·삐진 입(pout.py)·표정 포즈(poses2.py)·SVG 변환(rml2svg.py)과 캐릭터별 설정(*.json)

## 다시 만들기

Rive CLI(`brew install --cask rive-app/tap/rive-cli`)와 python3가 필요하다.

```bash
bash apps/web/assets/rive/_source/tools/build_all.sh
```

표정 값은 `poses2.py`의 표(P)와 캐릭터별 `*.json`의 `override`에서 고친다.
확인은 `rive <캐릭터 폴더> --screenshot --data=expression=<표정> --advance=60`.
