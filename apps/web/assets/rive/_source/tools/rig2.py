# 변환된 캐릭터 RML에 표정 리그(눈꺼풀 창·시선·눈썹 축·입선·효과)를 얹는 공용 일회성 변환 — 사용: rig2.py scene.rml 설정.json
import sys, json, math, copy, xml.etree.ElementTree as ET
p, cfg = sys.argv[1], json.load(open(sys.argv[2]))
t = ET.parse(p); R = t.getroot(); art = R.find('Artboard')
cnt = [cfg.get('rigIdBase', 100)]; C = cfg.get('client', 1)
def nid():
    cnt[0] += 1; return f'{C}:{cnt[0]}'
def el(tag, **a):
    e = ET.Element(tag); [e.set(k, str(v)) for k, v in a.items()]; return e
def by(name):
    return next(e for e in art.iter() if e.get('name') == name)
def parent(x):
    return next(e for e in art.iter() if x in list(e))
def solid(tag, color, **a):
    f = el(tag, name=tag, **a); f.append(el('SolidColor', colorValue=color, name='Color')); return f
def shift(n, dx, dy):
    for c in n:
        if c.tag in ('Shape', 'Node'):
            c.set('x', str(round(float(c.get('x', 0)) - dx, 4))); c.set('y', str(round(float(c.get('y', 0)) - dy, 4)))
def rebase(n, x, y):
    shift(n, x, y); n.set('x', str(x)); n.set('y', str(y)); n.set('id', nid())
def handles(v):
    # 꼭짓점의 들어오는·나가는 손잡이 위치 (Rive 정점 종류별 규칙)
    x, y = float(v.get('x')), float(v.get('y')); g = lambda k, d=0: float(v.get(k, d))
    if v.tag == 'CubicDetachedVertex':
        return (x + math.cos(g('inRotation')) * g('inDistance'), y + math.sin(g('inRotation')) * g('inDistance')), (x + math.cos(g('outRotation')) * g('outDistance'), y + math.sin(g('outRotation')) * g('outDistance'))
    if v.tag == 'CubicAsymmetricVertex':
        r = g('rotation'); return (x - math.cos(r) * g('inDistance'), y - math.sin(r) * g('inDistance')), (x + math.cos(r) * g('outDistance'), y + math.sin(r) * g('outDistance'))
    if v.tag == 'CubicMirroredVertex':
        r, d = g('rotation'), g('distance'); return (x - math.cos(r) * d, y - math.sin(r) * d), (x + math.cos(r) * d, y + math.sin(r) * d)
    return (x, y), (x, y)
def bbox(s):
    # 손잡이까지 따라 곡선을 표본 추출해 실제 테두리를 잰다 — 꼭짓점만 보면 볼록한 바닥을 놓친다
    pp = s.find('PointsPath'); sx, sy = float(s.get('x', 0)), float(s.get('y', 0))
    vs = [v for v in pp if v.tag.endswith('Vertex')]
    pts = []
    for i, a in enumerate(vs):
        b = vs[(i + 1) % len(vs)]
        p0 = (float(a.get('x')), float(a.get('y'))); p3 = (float(b.get('x')), float(b.get('y')))
        p1 = handles(a)[1]; p2 = handles(b)[0]
        for k in range(21):
            t_ = k / 20; u = 1 - t_
            pts.append(tuple(u**3 * q0 + 3 * u * u * t_ * q1 + 3 * u * t_ * t_ * q2 + t_**3 * q3 for q0, q1, q2, q3 in zip(p0, p1, p2, p3)))
    xs = [sx + x for x, _ in pts]; ys = [sy + y for _, y in pts]
    return min(xs), min(ys), max(xs), max(ys)
SKINNY = lambda: None

for node_name, new in cfg.get('rename', {}).items():
    nd = by(node_name); sh = [c for c in nd if c.tag == 'Shape']
    for c, nn in zip(sh, new): c.set('name', nn)
for nm in cfg.get('remove', []):
    s = by(nm); parent(s).remove(s)
head = by('head'); inner = by('head-inner')
# 몸에 붙여 둘 머리 조각(뒷머리) — 머리가 움직여도 어깨 위에서 틈이 생기지 않게 머리 바로 뒤에 고정
for nm in cfg.get('staticBehindHead', []):
    nd = by(nm); inner.remove(nd); vb = parent(head); vb.insert(list(vb).index(head) + 1, nd)
hx, hy = cfg['headPivot']; head.set('x', str(hx)); head.set('y', str(hy)); head.set('id', nid())
inner.set('x', str(-hx)); inner.set('y', str(-hy)); inner.set('id', nid())
torso = by('torso'); rebase(torso, *cfg['torsoPivot'])
for side, spec in cfg.get('synthBrows', {}).items():
    # 원본에 없는 눈썹: 짧고 둥근 획 (월드 중심, 폭, 두께, 색)
    bx, by_, bw, th, col = spec
    nd = el('Node', name=f'brow-{side}'); sh = el('Shape', x=bx, y=by_, name=f'brow-{side}-stroke'); pp = el('PointsPath', isClosed='false', name='Path')
    pp.append(el('CubicDetachedVertex', x=-bw / 2, y=bw * 0.08, inRotation=0, inDistance=0, outRotation=-0.35, outDistance=bw * 0.3))
    pp.append(el('CubicDetachedVertex', x=bw / 2, y=bw * 0.08, inRotation=-2.79, inDistance=bw * 0.3, outRotation=0, outDistance=0))
    sh.append(pp); st = el('Stroke', thickness=th, cap='round', name='Stroke'); st.append(el('SolidColor', colorValue=col, name='Color')); sh.append(st)
    nd.append(sh); inner.insert(0, nd)
for side in ('left', 'right'):
    b = by(f'brow-{side}'); main = by(cfg['brow'][side])
    x0, y0, x1, y1 = bbox(main); rebase(b, round((x0 + x1) / 2, 2), round((y0 + y1) / 2, 2))

for side, e in cfg['eyes'].items():
    eye = by(f'eye-{side}')
    contour = by(e['contour'])
    bbs = [bbox(contour if n == e['contour'] else next(c for c in eye if c.get('name') == n)) for n in e.get('mask', [e['contour']])]
    x0, y0, x1, y1 = min(b[0] for b in bbs), min(b[1] for b in bbs), max(b[2] for b in bbs), max(b[3] for b in bbs); cx, cy = round((x0 + x1) / 2, 2), round((y0 + y1) / 2, 2)
    rebase(eye, cx, cy)
    kids = {c.get('name'): c for c in eye}
    for c in list(eye): eye.remove(c)
    # 흰자: 기존 조각을 쓰거나 윤곽을 본떠 새로 깐다
    whites = [kids[n] for n in e.get('whites', [])]
    if e.get('whiteFromContour'):
        w = copy.deepcopy(contour); w.set('name', f'white-{side}')
        for f in w.findall('Fill'): w.remove(f)
        w.append(solid('Fill', e.get('whiteColor', 'FFFFFFFE'))); whites = whites + [w]
    def geom(names, name):
        n = el('Node', name=name, id=nid())
        for nm in names:
            src = contour if nm == e['contour'] else kids[nm]
            g = copy.deepcopy(src); g.attrib.pop('id', None); g.set('name', f'{name}-{nm}')
            for f in g.findall('Fill') + g.findall('Stroke'): g.remove(f)
            n.append(g)
        return n
    maskn = e.get('mask', [e['contour']])
    mask = geom(maskn, f'mask-{side}'); wid = mask.get('id')
    ap = geom(maskn, f'aperture-top-{side}')
    lid = el('Node', name=f'lid-{side}', id=nid()); blink = el('Node', name=f'blink-{side}', id=nid()); lid.append(blink)
    lashes = el('Node', name=f'lashes-{side}', id=nid()); blink.append(lashes)
    for n in e['lash']: lashes.append(kids[n])
    if 'lashArc' in e:
        th, col = e['lashArc']; hw_, hh_ = (x1 - x0) / 2, (y1 - y0) / 2; k = 0.5523
        sh = el('Shape', name=f'lash-arc-{side}'); pp = el('PointsPath', isClosed='false', name='Path')
        pp.append(el('CubicDetachedVertex', x=round(-hw_, 2), y=0, inRotation=0, inDistance=0, outRotation=-1.5708, outDistance=round(hh_ * k, 2)))
        pp.append(el('CubicMirroredVertex', x=0, y=round(-hh_, 2), rotation=0, distance=round(hw_ * k, 2)))
        pp.append(el('CubicDetachedVertex', x=round(hw_, 2), y=0, inRotation=-1.5708, inDistance=round(hh_ * k, 2), outRotation=0, outDistance=0))
        sh.append(pp); st = el('Stroke', thickness=th, cap='round', name='Stroke'); st.append(el('SolidColor', colorValue=col, name='Color')); sh.append(st)
        sh.append(el('ClippingShape', sourceId=wid, name='InsideEye'))
        lashes.insert(0, sh)
    blink.append(ap)
    low = el('Node', name=f'lower-lid-{side}', id=nid())
    bot = y1 - cy + 4 + cfg.get('lowerBotExtra', 0)
    hw = (x1 - x0) / 2
    dn = el('Shape', name=f'aperture-bottom-{side}', id=nid()); pp = el('PointsPath', isClosed='true', name='Path')
    hw = (x1 - x0) / 2
    # 눈 폭에 맞춘 ∩ 곡선 — 올라오면 웃는 눈매(초승달)가 된다
    pp.append(el('StraightVertex', x=-90, y=-140)); pp.append(el('StraightVertex', x=90, y=-140)); pp.append(el('StraightVertex', x=90, y=round(bot + 60, 2)))
    pp.append(el('StraightVertex', x=round(hw + 10, 2), y=round(bot + hw * 0.7, 2)))
    pp.append(el('CubicMirroredVertex', x=0, y=round(bot, 2), rotation=3.14159, distance=round(hw * 0.75, 2)))
    pp.append(el('StraightVertex', x=round(-hw - 10, 2), y=round(bot + hw * 0.7, 2))); pp.append(el('StraightVertex', x=-90, y=round(bot + 60, 2)))
    dn.append(pp); low.append(dn)
    gaze = el('Node', name=f'gaze-{side}', id=nid()); gaze.append(el('ClippingShape', sourceId=wid, name='Clip'))
    for n in e.get('iris', []): gaze.append(kids[n])
    if e.get('gazeOriginal'):
        # 원본 눈동자 = 어두운 눈 실루엣 중 흰자 조각에 덮이지 않은 부분. 그 부분만 오려(흰자 반전 ∩ 눈동자 근처 타원) 시선과 함께 옮긴다
        dark = copy.deepcopy(contour); dark.attrib.pop('id', None); dark.set('name', f'iris-{side}')
        inv = el('Node', name=f'iris-cut-{side}', id=nid())
        big = el('Shape', name='cut-rect'); pp = el('PointsPath', isClosed='true', name='Path')
        for x_, y_ in ((-200, -200), (200, -200), (200, 200), (-200, 200)): pp.append(el('StraightVertex', x=x_, y=y_))
        big.append(pp); inv.append(big)
        for n in e['gazeOriginal']['whites']:
            g = copy.deepcopy(kids[n]); g.attrib.pop('id', None); g.set('name', f'cut-{n}')
            for f in g.findall('Fill') + g.findall('Stroke'): g.remove(f)
            inv.append(g)
        ix, iy, iw, ih = e['gazeOriginal']['near']
        near = el('Shape', x=round(ix - cx, 2), y=round(iy - cy, 2), name=f'iris-near-{side}', id=nid()); near.append(el('Ellipse', width=iw, height=ih, name='Path'))
        dark.append(el('ClippingShape', sourceId=inv.get('id'), fillRule='evenOdd', name='NotWhite'))
        dark.append(el('ClippingShape', sourceId=near.get('id'), name='Near'))
        for n in e['gazeOriginal'].get('top', []): gaze.append(kids[n])
        gaze.append(dark); gaze.append(inv); gaze.append(near)
        # 원본 눈 테두리(검은 바탕 중 흰자도 눈동자도 아닌 부분 = 속눈썹 밑 두 번째 선) — 속눈썹과 함께 움직인다
        rim = copy.deepcopy(contour); rim.attrib.pop('id', None); rim.set('name', f'rim-{side}')
        inv2 = copy.deepcopy(inv); inv2.set('id', nid()); inv2.set('name', f'rim-cut-{side}')
        nn = el('Node', name=f'rim-notnear-{side}', id=nid())
        b2 = copy.deepcopy(big); nn.append(b2)
        n2 = copy.deepcopy(near); n2.set('id', nid()); n2.set('name', f'rim-near-{side}'); nn.append(n2)
        rim.append(el('ClippingShape', sourceId=inv2.get('id'), fillRule='evenOdd', name='NotWhite'))
        rim.append(el('ClippingShape', sourceId=nn.get('id'), fillRule='evenOdd', name='NotIris'))
        # 위쪽 띠만 — 눈 윗부분(중심보다 위)에 한정해야 눈 둘레에 테두리가 생기지 않는다
        top = el('Shape', name=f'rim-top-{side}', id=nid()); pp = el('PointsPath', isClosed='true', name='Path')
        cut = (y1 - y0) * e['gazeOriginal'].get('rimTop', 0.18) - (y1 - y0) / 2
        for x_, y_ in ((-200, -200), (200, -200), (200, cut), (-200, cut)): pp.append(el('StraightVertex', x=x_, y=round(y_, 2)))
        top.append(pp); rim.append(el('ClippingShape', sourceId=top.get('id'), name='TopOnly'))
        lashes.append(rim); lashes.append(inv2); lashes.append(nn); lashes.append(top)
    for i, (gx, gy, gr) in enumerate(e.get('shine', [])):
        sh = el('Shape', x=round(gx - cx, 2), y=round(gy - cy, 2), name=f'shine-{side}-{i}'); sh.append(el('Ellipse', width=gr * 2, height=gr * 2, name='Path')); sh.append(solid('Fill', 'F2FFFFFF')); gaze.append(sh)
    if 'irisPath' in e:
        # 원본 흰자 두 조각의 안쪽 가장자리를 그대로 따 만든 눈동자 (월드 좌표 → 눈 기준)
        sh = el('Shape', name=f'iris-{side}'); pp = el('PointsPath', isClosed='true', name='Path')
        for v in e['irisPath']:
            v = dict(v); v['x'] = round(v['x'] - cx, 3); v['y'] = round(v['y'] - cy, 3); pp.append(el('CubicDetachedVertex', **v))
        sh.append(pp); sh.append(solid('Fill', e.get('irisColor', 'FF2B2019'))); gaze.append(sh)
        for n in e.get('highlights', []): gaze.insert(1, kids[n])
    if 'irisEllipse' in e:
        ix, iy, iw, ih, col = e['irisEllipse']
        s = el('Shape', x=round(ix - cx, 2), y=round(iy - cy, 2), name=f'iris-{side}'); s.append(el('Ellipse', width=iw, height=ih, name='Path')); s.append(solid('Fill', col))
        gaze.append(s)
        for n in e.get('highlights', []): gaze.insert(1, kids[n])
    # 글썽이는 눈물: 아래 눈꺼풀을 따라 고인 물(위는 투명→아래 하늘빛) + 반짝이는 물결 하이라이트
    ew, eh = (x1 - x0), (y1 - y0)
    tear = el('Node', y=round(bot - eh * 0.02, 2), opacity='0', name=f'tear-{side}', id=nid())
    tear.append(el('ClippingShape', sourceId=wid, name='Clip'))
    pool = el('Shape', name=f'tear-pool-{side}', id=nid()); pool.append(el('Ellipse', width=round(ew * 1.1, 1), height=round(eh * 0.5, 1), name='Path'))
    pf = el('Fill', name='Fill'); g = el('LinearGradient', startX=0, startY=round(-eh * 0.21, 2), endX=0, endY=round(eh * 0.08, 2), name='Gradient')
    g.append(el('GradientStop', colorValue='00BFE4FF', position='0', name='Stop')); g.append(el('GradientStop', colorValue='B3A2D8FF', position='0.55', name='Stop')); g.append(el('GradientStop', colorValue='D98FC8F6', position='1', name='Stop'))
    pf.append(g); pool.append(pf)
    edge = el('Shape', y=round(-eh * 0.08, 2), name=f'tear-edge-{side}', id=nid()); pp = el('PointsPath', isClosed='false', name='Path')
    pp.append(el('CubicDetachedVertex', x=round(-ew * 0.42, 2), y=round(eh * 0.06, 2), inRotation=0, inDistance=0, outRotation=-0.25, outDistance=round(ew * 0.2, 2)))
    pp.append(el('CubicMirroredVertex', x=0, y=round(-eh * 0.02, 2), rotation=0, distance=round(ew * 0.22, 2)))
    pp.append(el('CubicDetachedVertex', x=round(ew * 0.42, 2), y=round(eh * 0.06, 2), inRotation=-2.89, inDistance=round(ew * 0.2, 2), outRotation=0, outDistance=0))
    edge.append(pp); st = el('Stroke', thickness=round(max(1.6, ew * 0.05), 2), cap='round', name='Stroke'); st.append(el('SolidColor', colorValue='E6FFFFFF', name='Color')); edge.append(st)
    shine = el('Shape', x=round(ew * 0.18, 2), y=round(eh * 0.06, 2), name=f'tear-shine-{side}', id=nid()); shine.append(el('Ellipse', width=round(ew * 0.11, 2), height=round(ew * 0.07, 2), name='Path')); shine.append(solid('Fill', 'FFFFFFFF'))
    for c_ in (shine, pool): tear.append(c_)  # 물결 흰 선은 어색해서 뺀다
    slant = el('Node', y='-200', name=f'slant-{side}', id=nid())
    sclip = el('Shape', name=f'slant-clip-{side}', id=nid()); pp = el('PointsPath', isClosed='true', name='Path')
    for x_, y_ in ((-300, 0), (300, 0), (300, 600), (-300, 600)): pp.append(el('StraightVertex', x=x_, y=y_))
    sclip.append(pp); slant.append(sclip)
    sth, scol = e.get('slantLine', cfg.get('slantLine', [5, 'FF2B2019']))
    sline = el('Shape', opacity='0', name=f'slant-line-{side}', id=nid()); pp = el('PointsPath', isClosed='false', name='Path')
    sl = cfg.get('slantLen', 0.5); pp.append(el('StraightVertex', x=round(-(x1 - x0) * sl, 2), y=0)); pp.append(el('StraightVertex', x=round((x1 - x0) * sl, 2), y=0))
    sline.append(pp); st = el('Stroke', thickness=sth, cap='round', name='Stroke'); st.append(el('SolidColor', colorValue=scol, name='Color')); sline.append(st)
    slant.append(sline)
    opening = el('Node', name=f'opening-{side}', id=nid())
    opening.append(el('ClippingShape', sourceId=sclip.get('id'), name='Slant'))
    if 'trim' in e:
        # 흰자의 뾰족한 꼬리(속눈썹 날개 밑에 숨어 있던 부분)를 둥근 눈 모양으로 잘라 낸다
        tx_, ty_, tw_, th_ = e['trim']
        tr_ = el('Shape', x=round(tx_ - cx, 2), y=round(ty_ - cy, 2), name=f'trim-{side}', id=nid()); tr_.append(el('Ellipse', width=tw_, height=th_, name='Path'))
        eye.append(tr_); opening.append(el('ClippingShape', sourceId=tr_.get('id'), name='Trim'))
    opening.append(el('ClippingShape', sourceId=ap.get('id'), name='Lid')); opening.append(el('ClippingShape', sourceId=dn.get('id'), name='LowerLid'))
    opening.append(tear); opening.append(gaze)
    for w in whites: opening.append(w)
    if e.get('gazeOriginal'):
        # 원본 검은 눈 바탕을 흰자 아래에 그대로 깐다 — 흰자 사이로 보이던 테두리·틈이 원본처럼 남는다
        base_ = copy.deepcopy(contour); base_.attrib.pop('id', None); base_.set('name', f'eye-base-{side}'); opening.append(base_)
    if 'closedArc' in e:
        th, col, dy = e['closedArc']; w = (x1 - x0) * 0.86; h = w * 0.36
        sh = el('Shape', y=round(dy, 2), opacity='0', name=f'closed-{side}', id=nid()); pp = el('PointsPath', isClosed='false', name='Path')
        pp.append(el('CubicDetachedVertex', x=round(-w / 2, 2), y=round(h / 2, 2), inRotation=0, inDistance=0, outRotation=-1.35, outDistance=round(h * 0.55, 2)))
        pp.append(el('CubicMirroredVertex', x=0, y=round(-h / 2, 2), rotation=0, distance=round(w * 0.3, 2)))
        pp.append(el('CubicDetachedVertex', x=round(w / 2, 2), y=round(h / 2, 2), inRotation=-1.79, inDistance=round(h * 0.55, 2), outRotation=0, outDistance=0))
        sh.append(pp); st = el('Stroke', thickness=th, cap='round', join='round', name='Stroke'); st.append(el('SolidColor', colorValue=col, name='Color')); sh.append(st)
        eye.append(sh)
    eye.append(lid)
    if e.get('static'):
        crease = el('Node', name=f'crease-{side}', id=nid())
        for n in e['static']: crease.append(kids[n])
        cb = el('Node', name=f'crease-blink-{side}', id=nid()); cb.append(crease); eye.append(cb)
    lashes.append(el('ClippingShape', sourceId=sclip.get('id'), name='Slant'))
    sb = el('Node', name=f'slant-blink-{side}', id=nid()); sb.append(slant); eye.insert(0, sb); lb = el('Node', name=f'lowblink-{side}', id=nid()); lb.append(low); eye.append(lb); eye.append(opening); eye.append(mask)

# 입: 원래 입은 mouth-open으로, 그 위에 모양이 변하는 입선
mouth = by('mouth'); rebase(mouth, *cfg['mouthPivot'])
op = el('Node', name='mouth-open', id=nid())
for c in list(mouth): mouth.remove(c); op.append(c)
mouth.append(op)
# 다문 입: 가운데가 도톰하고 입꼬리로 갈수록 가늘어지는 입술 — 위 가장자리 5점 + 아래 가장자리 5점, 표정마다 점을 옮겨 모핑
line = el('Shape', name='mouth-line', id=nid()); pp = el('PointsPath', isClosed='true', name='Path')
for i in range(10): pp.append(el('CubicMirroredVertex', x=0, y=0, rotation=0, distance=1, name=f'v{i}', id=nid()))
line.append(pp); line.append(solid('Fill', cfg['lineColor']))
ms_ = cfg['mouthScale']; lc = cfg['lineColor']
# 아랫입술 그림자 — 입술 선 아래 짧은 곡선
ll = el('Node', name='lip-lower', opacity='0', id=nid()); sh = el('Shape', name='lip-lower-shape'); pp = el('PointsPath', isClosed='false', name='Path')
pp.append(el('CubicDetachedVertex', x=round(-3.6 * ms_, 2), y=0, inRotation=0, inDistance=0, outRotation=0.3, outDistance=round(1.5 * ms_, 2)))
pp.append(el('CubicMirroredVertex', x=0, y=round(0.9 * ms_, 2), rotation=0, distance=round(1.6 * ms_, 2)))
pp.append(el('CubicDetachedVertex', x=round(3.6 * ms_, 2), y=0, inRotation=2.84, inDistance=round(1.5 * ms_, 2), outRotation=0, outDistance=0))
sh.append(pp); st = el('Stroke', thickness=round(2.0 * ms_, 2), cap='round', name='Stroke'); st.append(el('SolidColor', colorValue=cfg.get('lipShade', '40' + lc[2:]), name='Color')); sh.append(st); ll.append(sh)
# 이를 악문 입(분노) — 벌어진 입 안에 윗니·아랫니와 그 사이 틈
grit = el('Node', name='mouth-grit', opacity='0', id=nid())
def trap(w_top, w_bot, top, bot, cy, name, col, r=2.2):
    # 위가 넓고 아래가 좁은 사다리꼴, 입꼬리(위 양끝)는 아래로 처진다
    sh = el('Shape', name=name); pp = el('PointsPath', isClosed='true', name='Path')
    for x_, y_ in ((-w_top, cy), (0, top), (w_top, cy), (w_bot, bot), (-w_bot, bot)):
        pp.append(el('StraightVertex', x=round(x_ * ms_, 2), y=round(y_ * ms_, 2), radius=round(r * ms_, 2)))
    sh.append(pp); sh.append(solid('Fill', col)); return sh
grit.append(trap(16, 10, -2.4, 7.2, 1.8, 'grit-outer', lc, 3))
grit.insert(0, trap(13.4, 8.2, -0.8, 5.4, 1.7, 'grit-teeth', 'FFFDFCFC', 2))
gap = el('Shape', name='grit-gap'); pp = el('PointsPath', isClosed='false', name='Path')
pp.append(el('StraightVertex', x=round(-11.6 * ms_, 2), y=round(3.4 * ms_, 2))); pp.append(el('CubicMirroredVertex', x=0, y=round(2.5 * ms_, 2), rotation=0, distance=round(5 * ms_, 2))); pp.append(el('StraightVertex', x=round(11.6 * ms_, 2), y=round(3.4 * ms_, 2)))
gap.append(pp); st = el('Stroke', thickness=round(1.3 * ms_, 2), cap='round', name='Stroke'); st.append(el('SolidColor', colorValue='E6' + lc[2:], name='Color')); gap.append(st)
grit.insert(0, gap)
mouth.insert(0, grit); mouth.insert(0, ll); mouth.insert(0, line)

# 효과
for nm in cfg.get('moveBelowEyes', []):
    nd = by(nm); inner.remove(nd); kids_ = list(inner); inner.insert(kids_.index(by('face')), nd)
anchor = by(cfg.get('effectsAbove', 'face')); kids = list(inner)
blush = el('Node', name='blush-strong', opacity='0', id=nid())
bw, bh = cfg['blushSize']
for cx, cy in cfg['cheeks']:
    s = el('Shape', x=cx, y=cy, name='cheek'); s.append(el('Ellipse', width=bw, height=bh, name='Path'))
    f = el('Fill', fillRule='clockwise', name='Fill'); f.append(el('SolidColor', colorValue=cfg.get('blushColor', 'B3FF6F86'), name='Color')); f.append(el('Feather', strength=round(bh * 0.28, 1), name='Feather')); s.append(f); blush.append(s)
    for k in (-1, 0, 1):
        h = el('Shape', x=round(cx + k * bw * 0.18, 2), y=cy, name='hatch'); pp = el('PointsPath', isClosed='false', name='Path')
        u = bh / 26
        pp.append(el('StraightVertex', x=round(-2.5 * u, 2), y=round(4 * u, 2))); pp.append(el('StraightVertex', x=round(2.5 * u, 2), y=round(-4 * u, 2))); h.append(pp)
        st = el('Stroke', thickness=round(2 * u, 2), cap='round', name='Stroke'); st.append(el('SolidColor', colorValue='CCE5566A', name='Color')); h.append(st); blush.append(h)
inner.insert(kids.index(anchor), blush)
ax, ay, ar = cfg['anger']
anger = el('Node', x=ax, y=ay, rotation='-0.28', opacity='0', scaleX='0.5', scaleY='0.5', name='anger-mark', id=nid())
# 웹툰식 핏줄 — 꺾쇠마다 길이·굵기·휨을 조금씩 달리해 손으로 그린 느낌을 낸다
VAR = {(-1, -1): (1.0, 0.95, 0.18), (1, -1): (0.82, 1.1, -0.12), (-1, 1): (1.12, 0.85, -0.2), (1, 1): (0.9, 1.0, 0.15)}
for (sx, sy), (la, lb, bend) in VAR.items():
    s_ = el('Shape', name='vein'); pp = el('PointsPath', isClosed='false', name='Path')
    g0 = ar * 0.28
    a_ = (sx * ar * la, sy * g0); b_ = (sx * g0, sy * ar * lb)
    pp.append(el('CubicDetachedVertex', x=round(a_[0], 2), y=round(a_[1], 2), inRotation=0, inDistance=0, outRotation=round(math.pi if sx > 0 else 0, 3), outDistance=round(ar * 0.35, 2)))
    pp.append(el('CubicDetachedVertex', x=round(sx * g0 * (1 + bend), 2), y=round(sy * g0 * (1 - bend), 2), inRotation=round(0 if sx > 0 else math.pi, 3), inDistance=round(ar * 0.2, 2), outRotation=round(math.pi / 2 * sy, 3), outDistance=round(ar * 0.2, 2)))
    pp.append(el('CubicDetachedVertex', x=round(b_[0], 2), y=round(b_[1], 2), inRotation=round(-math.pi / 2 * sy, 3), inDistance=round(ar * 0.35, 2), outRotation=0, outDistance=0))
    s_.append(pp)
    st = el('Stroke', thickness=round(ar / 3 * (0.85 + 0.3 * la / 1.12), 2), cap='round', join='round', name='Stroke'); st.append(el('SolidColor', colorValue='FFE5484D', name='Color')); s_.append(st); anger.append(s_)
def heart(cx, cy, s, name):
    n = el('Node', x=cx, y=cy, opacity='0', scaleX='0.4', scaleY='0.4', name=name, id=nid())
    sh = el('Shape', name='heart'); pp = el('PointsPath', isClosed='true', name='Path')
    for v in (dict(x=0, y=s * 0.95, inRotation=-2.4, inDistance=s * 0.9, outRotation=-0.74, outDistance=s * 0.9),
              dict(x=s * 1.05, y=-s * 0.25, inRotation=1.35, inDistance=s * 0.45, outRotation=-1.79, outDistance=s * 0.5),
              dict(x=0, y=-s * 0.45, inRotation=-0.35, inDistance=s * 0.55, outRotation=-2.79, outDistance=s * 0.55),
              dict(x=-s * 1.05, y=-s * 0.25, inRotation=-1.35, inDistance=s * 0.5, outRotation=1.79, outDistance=s * 0.45)):
        pp.append(el('CubicDetachedVertex', **{k: round(v_, 3) for k, v_ in v.items()}))
    sh.append(pp); f = el('Fill', name='Fill'); g = el('LinearGradient', startX=0, startY=-s, endX=0, endY=s, name='Gradient')
    g.append(el('GradientStop', colorValue='FFFF8FA6', position='0', name='Stop')); g.append(el('GradientStop', colorValue='FFE93D63', position='1', name='Stop'))
    f.append(g); sh.append(f); n.append(sh)
    hl = el('Shape', x=round(-s * 0.45, 2), y=round(-s * 0.2, 2), rotation=-0.6, name='shine'); hl.append(el('Ellipse', width=round(s * 0.42, 2), height=round(s * 0.22, 2), name='Path')); hl.append(solid('Fill', 'CCFFFFFF')); n.append(hl)
    return n
hearts = el('Node', name='hearts', id=nid())
for i, (x, y, s) in enumerate(cfg['hearts']): hearts.append(heart(x, y, s, 'heart-' + 'abc'[i]))
inner.insert(0, anger); inner.insert(0, hearts)
ET.indent(t, space='    '); t.write(p, encoding='unicode'); print('rig ok')
