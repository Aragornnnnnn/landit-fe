# 캐릭터 리그 위에 표정 8종 포즈·효과 루프·깜빡임·숨쉬기·상태머신·뷰모델을 (다시) 얹는 생성기
# 사용: poses2.py scene.rml <캐릭터설정.json>  — 이전에 만든 생성물은 지우고 다시 만든다
import sys, json, math, xml.etree.ElementTree as ET
p, cfg = sys.argv[1], json.load(open(sys.argv[2]))
t = ET.parse(p); R = t.getroot(); art = R.find('Artboard')
used = {e.get('id') for e in R.iter() if e.get('id')}
cnt = [cfg.get('idBase', 6000)]
def nid():
    while True:
        cnt[0] += 1; i = f"{cfg.get('client', 1)}:{cnt[0]}"
        if i not in used: used.add(i); return i
def el(tag, **a):
    e = ET.Element(tag); [e.set(k, str(v)) for k, v in a.items()]; return e
def by(name):
    for e in art.iter():
        if e.get('name') == name and e.tag not in ('Tendon',): return e
    raise KeyError(name)
def idof(name):
    e = by(name)
    if not e.get('id'): e.set('id', nid())
    return e.get('id')
# 지난 생성물 걷기
for a in [a for a in art.findall('LinearAnimation') if a.get('name', '').startswith(('pose-', 'fx-')) or a.get('name') in ('blink', 'breathe')]: art.remove(a)
for sm in art.findall('StateMachine'): art.remove(sm)
for x in [x for x in R if x.tag in ('ViewModel', 'DataEnumCustom')]: R.remove(x)

EXPR = ['neutral', 'happy', 'frown', 'angry', 'sad', 'love', 'sulky', 'shy']
enum = el('DataEnumCustom', name='Expression', id=nid()); ev = {}
for k in EXPR:
    ev[k] = nid(); enum.append(el('DataEnumValue', key=k, value=k.capitalize(), id=ev[k]))
vm = el('ViewModel', name='Partner', id=nid())
prop = el('ViewModelPropertyEnumCustom', enumId=enum.get('id'), name='expression', id=nid()); vm.append(prop)
inst = el('ViewModelInstance', exports='true', name='Default', id=nid())
inst.append(el('ViewModelInstanceEnum', propertyValue=ev['neutral'], viewModelPropertyId=prop.get('id')))
vm.append(inst); vm.set('defaultInstanceId', inst.get('id'))
R.append(enum); R.append(vm)
art.set('viewModelId', vm.get('id')); art.set('viewModelInstanceId', inst.get('id'))

ms, es, bs, hs = cfg['mouthScale'], cfg['eyeScale'], cfg['browScale'], cfg.get('headScale', 1)
def M(pts): return [(x * ms, y * ms) for x, y in pts]
def mouth(pts):
    out = []
    for i, (x, y) in enumerate(pts):
        a = pts[max(i - 1, 0)]; b = pts[min(i + 1, len(pts) - 1)]
        out.append((x, y, math.atan2(b[1] - a[1], b[0] - a[0]), abs(b[0] - a[0]) / (3 if 0 < i < len(pts) - 1 else 1.5)))
    return out
SMILE = [(-22, -6), (-11, 1.5), (0, 3.5), (11, 1.5), (22, -6)]
BASE = dict(lidY=0, lidRot=0, lowY=0, gazeX=0, gazeY=0, browY=0, browRot=0, browX=0, browSY=1,
            line=[(-13, -2.5), (-6.5, 1.2), (0, 2.2), (6.5, 1.2), (13, -2.5)], thick=1, lineOp=1,
            openOp=0, openS=0.55, pout=0, headX=0, headY=0, headRot=0, blush=0, tear=0,
            bump=dict(y=-2, rot=0, brow=-2))
# 값 단위: 눈·눈썹·머리 이동은 클로이 기준 픽셀(캐릭터별 배율이 곱해짐), 회전은 라디안. lidRot·browRot는 왼쪽(화면 기준) 눈 기준이고 오른쪽은 부호가 뒤집힌다
P = {
 'neutral': {},
 'happy': dict(closed=1, lidY=14, lowY=-46, browY=-9, browRot=-0.06, browSY=1.12, line=SMILE, lineOp=0, openOp=1, openS=1.08, headRot=-0.05, headY=-6, blush=0.5, bump=dict(y=-10, rot=-0.03, brow=-6)),
 'frown': dict(lipLow=0.45, slantOp=1, slantY=-10, slantRot=0.14, lidY=0, lidRot=0, lowY=-3, gazeX=-1.5, browY=5, browRot=0.22, browX=2, browSY=0.8, line=[(-12, 3), (-6, 0), (0, -1), (6, 0), (12, 3)], thick=0.75, headRot=0.035, headY=3, bump=dict(y=3, rot=0.02, brow=3)),
 'angry': dict(slantOp=1, slantY=-8, slantRot=0.2, lidY=0, lidRot=0, lowY=-4, gazeY=1, browY=9, browRot=0.4, browX=7, browSY=0.7, line=[(-11, 2.6), (-5.5, 0.2), (0, -0.7), (5.5, 0.2), (11, 2.6)], thick=1.0, headY=4, bump=dict(y=4, rot=0, brow=5)),
 'sad': dict(lipLow=0.5, lidY=6, lidRot=-0.18, lowY=-3, gazeY=2.5, browY=-3, browRot=-0.22, browSY=0.9, line=[(-10, 3.5), (-5, 0.5), (0, -0.6), (5, 0.5), (10, 3.5)], thick=0.72, headRot=0.07, headY=5, tear=1, bump=dict(y=4, rot=0.03, brow=-3)),
 'love': dict(lidY=0, lowY=-12, gazeY=-1, browY=-8, browRot=-0.08, browSY=1.1, line=SMILE, lineOp=0, openOp=1, openS=1.02, headRot=-0.07, headY=-4, blush=1, bump=dict(y=-10, rot=-0.04, brow=-5)),
 'sulky': dict(pout=0, lineOp=1, lipLow=0.85, slantOp=1, slantY=-1, slantRot=-0.07, lidY=0, lidRot=0, lowY=-3, gazeX=4.5, gazeY=-1, browY=6, browRot=0.12, browSY=0.75, line=[(-3, 1.0), (0.5, 0.2), (4, 0.2), (7.5, 0.9), (10.5, 2.6)], thick=0.8, headRot=-0.08, headX=-6, blush=0.45, bump=dict(y=0, rot=-0.05, brow=3)),
 'shy': dict(lipLow=0.25, lidY=3, lowY=-6, gazeX=-2.5, gazeY=4.5, browY=-3, browRot=-0.18, browSY=0.92, line=[(-9, -0.5), (-4.5, 1.6), (0, 0.4), (4.5, 1.6), (9, -0.5)], thick=0.72, headRot=0.06, headY=7, blush=1, bump=dict(y=4, rot=0.04, brow=-2)),
}
for k, d in cfg.get('override', {}).items(): P[k].update(d)
# 감은 눈 곡선을 위 눈꺼풀에 붙인다 — 눈을 뜰 때 속눈썹과 함께 올라가며 사라져 흰자 위를 지나가지 않는다
for sd in ('left', 'right'):
    if any(e.get('name') == f'closed-{sd}' for e in art.iter()):
        arc = by(f'closed-{sd}'); eye_ = by(f'eye-{sd}'); lid_ = by(f'lid-{sd}')
        if arc in list(eye_):
            eye_.remove(arc); lid_.insert(0, arc)
            arc.set('y', str(round(float(arc.get('y', 0)) - P['happy']['lidY'] * es, 3)))
verts = [v.get('id') for v in by('mouth-line').find('PointsPath') if v.tag != 'Skin']
PROFILE = (0.42, 0.9, 1, 0.9, 0.42)  # 입꼬리는 가늘고 가운데는 도톰하게
def lips(pts, half):
    # 중심선 5점과 두께로 위·아래 가장자리 10점을 만든다 (위는 왼→오, 아래는 오→왼)
    n = len(pts); out = []
    ang = [math.atan2(pts[min(i + 1, n - 1)][1] - pts[max(i - 1, 0)][1], pts[min(i + 1, n - 1)][0] - pts[max(i - 1, 0)][0]) for i in range(n)]
    gap = [abs(pts[min(i + 1, n - 1)][0] - pts[max(i - 1, 0)][0]) / (3 if 0 < i < n - 1 else 1.5) for i in range(n)]
    for i in range(n):
        t = half * PROFILE[i]; nx, ny = -math.sin(ang[i]), math.cos(ang[i])
        out.append((pts[i][0] - nx * t, pts[i][1] - ny * t, ang[i], gap[i] * 0.75))
    for i in reversed(range(n)):
        t = half * PROFILE[i]; nx, ny = -math.sin(ang[i]), math.cos(ang[i])
        out.append((pts[i][0] + nx * t, pts[i][1] + ny * t, ang[i] + math.pi, gap[i] * 0.75))
    return out
browB = {s: (float(by(f'brow-{s}').get('x')), float(by(f'brow-{s}').get('y'))) for s in ('left', 'right')}
headB = (float(by('head').get('x')), float(by('head').get('y')))
EASE = (0.42, 0, 0.58, 1); OUT = (0.2, 0.8, 0.3, 1)
def kf(v, f=0, curve=None):
    k = el('KeyFrameDouble', value=round(v, 4), frame=f, interpolationType='cubic' if curve else 'hold')
    if curve: k.append(el('CubicEaseInterpolator', x1=curve[0], y1=curve[1], x2=curve[2], y2=curve[3]))
    return k
def trk(obj, key, keys):
    ko = el('KeyedObject', objectId=obj); kp = el('KeyedProperty', propertyKey=key)
    for k in keys: kp.append(k)
    ko.append(kp); return ko
def bumped(v, b):  # 진입하자마자 살짝 지나쳤다 제자리로
    return [kf(v + b, 0, OUT), kf(v - b * 0.25, 12, EASE), kf(v, 26)]
has = lambda n: any(e.get('name') == n for e in art.iter())
def pose(name):
    q = dict(BASE, **P[name]); b = dict(BASE['bump'], **P[name].get('bump', {}))
    a = el('LinearAnimation', name=f'pose-{name}', duration=26, fps=60, id=nid()); T = []
    c = lambda o, k, v: T.append(trk(o, k, [kf(v)]))
    for s, sg in (('left', 1), ('right', -1)):
        c(idof(f'lid-{s}'), 14, q['lidY'] * es); c(idof(f'lid-{s}'), 15, sg * q['lidRot'])
        c(idof(f'lower-lid-{s}'), 14, q['lowY'] * es)
        if has(f'crease-{s}'): c(idof(f'crease-{s}'), 14, q['lidY'] * es * 0.6); c(idof(f'crease-{s}'), 15, sg * q['lidRot'] * 0.6)
        cl, so = q.get('closed', 0), q.get('slantOp', 0)
        if has(f'lashes-{s}'): c(idof(f'lashes-{s}'), 18, (1 - cl) * ((1 - so) if cfg.get('slantHidesLashes') else 1))
        if has(f'trim-{s}'):
            # 흰자 꼬리 깎기는 사선 표정에서만 — 다른 표정에선 크게 키워 원본 흰자를 그대로 둔다
            c(idof(f'trim-{s}'), 16, 1 if so else 4); c(idof(f'trim-{s}'), 17, 1 if so else 4)
        if has(f'slant-{s}'):
            c(idof(f'slant-{s}'), 14, q.get('slantY', -60) * es); c(idof(f'slant-{s}'), 15, sg * q.get('slantRot', 0))
            c(idof(f'slant-line-{s}'), 18, so)
        if has(f'crease-{s}'): c(idof(f'crease-{s}'), 18, (1 - cl) * (1 - so))
        if has(f'closed-{s}'):
            c(idof(f'closed-{s}'), 18, cl)
        if has(f'lower-line-{s}'): c(idof(f'lower-line-{s}'), 18, min(max((-q['lowY'] - 6) / 14, 0), 0.7) * max(0, 1 - max(q['lidY'], 0) / 18))
        gs = cfg.get('gazeScale', 1)
        c(idof(f'gaze-{s}'), 13, q['gazeX'] * es * gs); c(idof(f'gaze-{s}'), 14, q['gazeY'] * es * gs * cfg.get('gazeYScale', 1))
        bx, by_ = browB[s]
        c(idof(f'brow-{s}'), 13, bx + sg * q['browX'] * bs)
        T.append(trk(idof(f'brow-{s}'), 14, bumped(by_ + q['browY'] * bs, b['brow'] * bs)))
        c(idof(f'brow-{s}'), 15, sg * q['browRot']); c(idof(f'brow-{s}'), 17, q['browSY'])
        if cfg.get('browFade'): c(idof(f'brow-{s}'), 18, q.get('browOp', 1))
        if has(f'tear-{s}'): c(idof(f'tear-{s}'), 18, q['tear'])
    half = cfg['lineThick'] * 0.5 * q['thick'] * cfg.get('lipFull', 0.92)
    for vid, (x, y, r, d) in zip(verts, lips(M(q['line']), half)):
        c(vid, 24, x); c(vid, 25, y); c(vid, 82, r); c(vid, 83, d)
    c(idof('mouth-line'), 18, q['lineOp'])
    mid_y = M(q['line'])[2][1]
    c(idof('lip-lower'), 13, M(q['line'])[2][0]); c(idof('lip-lower'), 14, mid_y + half + 1.6 * ms)
    c(idof('lip-lower'), 18, 0)  # 아랫입술 그림자는 두 번째 입처럼 보여 쓰지 않는다
    c(idof('mouth-grit'), 18, q.get('grit', 0))
    for k in (16, 17): T.append(trk(idof('mouth-grit'), k, bumped(0.7 + 0.45 * q.get('grit', 0), 0.12 * q.get('grit', 0))))
    c(idof('mouth-open'), 18, q['openOp'])
    T.append(trk(idof('mouth-open'), 16, bumped(q['openS'], 0.06 * q['openOp'])))
    T.append(trk(idof('mouth-open'), 17, bumped(q['openS'], 0.1 * q['openOp'])))
    c(idof('head'), 13, headB[0] + q['headX'] * hs)
    T.append(trk(idof('head'), 14, bumped(headB[1] + q['headY'] * hs, b['y'] * hs)))
    rs = cfg.get('headRotScale', 1)
    T.append(trk(idof('head'), 15, bumped(q['headRot'] * rs, b['rot'] * rs)))
    c(idof('blush-strong'), 18, q['blush'])
    # 흰자 가장자리 선(원본)은 눈꺼풀이 제자리일 때만 — 눈꺼풀을 따라 움직이면 흰자에서 떨어져 떠 보인다
    at_rest = abs(q['lidY']) < 0.5 and abs(q['lidRot']) < 0.01 and not q.get('closed') and not q.get('slantOp')
    for nm_ in cfg.get('restOnly', []):
        if has(nm_): c(idof(nm_), 18, 1 if at_rest else 0)
    # 눈 반짝임도 감정을 말한다 — 화나면 작게 하나, 기쁘면 크게 [큰 것 투명도, 크기, 작은 것 투명도, 크기]
    sh = cfg.get('shineByExpr', {}).get(name)
    if sh:
        for s_ in ('left', 'right'):
            for i_, (op_, sc_) in enumerate(((sh[0], sh[1]), (sh[2], sh[3]))):
                nm_ = f'shine-{s_}-{i_}'
                if has(nm_):
                    c(idof(nm_), 18, op_); c(idof(nm_), 16, sc_); c(idof(nm_), 17, sc_)
    if cfg.get('baseBlush') and has(cfg['baseBlush']):
        # 원래 볼터치는 기분 나쁜 표정에선 발그레해 보여 감정이 섞이므로 옅게
        c(idof(cfg['baseBlush']), 18, {'frown': 0.15, 'angry': 0.1, 'sad': 0.55}.get(name, 1))
    if has('mouth-pout'):
        c(idof('mouth-pout'), 18, q['pout'])
        for k in (16, 17): T.append(trk(idof('mouth-pout'), k, bumped(0.6 + 0.4 * q['pout'], 0.18 * q['pout'])))
    for o in T: a.append(o)
    return a
poses = {k: pose(k) for k in EXPR}
# 효과 루프 — 표정 층과 따로 돌아야 진입 튐이 매 루프 반복되지 않는다
def fx(name, anger=False, love=False):
    a = el('LinearAnimation', name=f'fx-{name}', duration=56 if anger else 160 if love else 1, loopValue='loop' if (anger or love) else 'oneShot', fps=60, id=nid())
    ai = idof('anger-mark')
    if anger:
        a.append(trk(ai, 18, [kf(1)]))
        for k in (16, 17): a.append(trk(ai, k, [kf(1, 0, EASE), kf(1.22, 12, EASE), kf(0.96, 24, EASE), kf(1, 34)]))
    else:
        a.append(trk(ai, 18, [kf(0)])); a.append(trk(ai, 16, [kf(0.5)])); a.append(trk(ai, 17, [kf(0.5)]))
    for i, h in enumerate(('heart-a', 'heart-b', 'heart-c')):
        hi = idof(h); hy = float(by(h).get('y'))
        if love:
            o = [0, 45, 90][i]; s0, s1, s2, s3 = o, o + 14, o + 50, o + 70
            a.append(trk(hi, 18, [kf(0, 0), kf(0, s0, EASE), kf(1, s1), kf(1, s2, EASE), kf(0, s3)]))
            a.append(trk(hi, 14, [kf(hy, 0), kf(hy, s0, (0.2, 0.6, 0.4, 1)), kf(hy - 36 * hs, s3)]))
            for k in (16, 17): a.append(trk(hi, k, [kf(0.4, 0), kf(0.4, s0, (0.3, 1.7, 0.6, 1)), kf(1, s1, EASE), kf(0.85, s3)]))
        else:
            a.append(trk(hi, 18, [kf(0)])); a.append(trk(hi, 14, [kf(hy)])); a.append(trk(hi, 16, [kf(0.4)])); a.append(trk(hi, 17, [kf(0.4)]))
    return a
fxs = {'none': fx('none'), 'angry': fx('angry', anger=True), 'love': fx('love', love=True)}
SINE = (0.45, 0, 0.55, 1)
sad_fx = fx('sad'); sad_fx.set('duration', '150'); sad_fx.set('loopValue', 'loop')
for s_ in ('left', 'right'):
    if not has(f'tear-pool-{s_}'): continue
    # 고인 물이 차올랐다 가라앉듯 천천히 숨쉬고, 하이라이트가 물결 위를 미끄러진다
    sad_fx.append(trk(idof(f'tear-pool-{s_}'), 17, [kf(1, 0, SINE), kf(1.1, 75, SINE), kf(1, 150)]))
    sad_fx.append(trk(idof(f'tear-pool-{s_}'), 16, [kf(1, 0, SINE), kf(1.03, 75, SINE), kf(1, 150)]))
    ex = float(by(f'tear-shine-{s_}').get('x')); ey = float(by(f'tear-shine-{s_}').get('y'))
    sad_fx.append(trk(idof(f'tear-shine-{s_}'), 13, [kf(ex, 0, SINE), kf(ex - abs(ex) * 0.5, 75, SINE), kf(ex, 150)]))
    sad_fx.append(trk(idof(f'tear-shine-{s_}'), 14, [kf(ey, 0, SINE), kf(ey - 1.2 * es, 75, SINE), kf(ey, 150)]))
    sad_fx.append(trk(idof(f'tear-shine-{s_}'), 18, [kf(1, 0, SINE), kf(0.55, 40, SINE), kf(1, 90, SINE), kf(1, 150)]))
fxs['sad'] = sad_fx
blink = el('LinearAnimation', name='blink', duration=300, loopValue='loop', fps=60, id=nid())
def bk(peak):
    ks = [kf(0, 0)]
    for st in (150, 262, 279): ks += [kf(0, st, (0.5, 0, 0.9, 0.6)), kf(peak, st + 5, (0.15, 0, 0.3, 1)), kf(0, st + 13)]
    return ks
# 깜빡임: 위 눈꺼풀이 내려오고 아래 눈꺼풀이 살짝 올라와 눈 가운데보다 조금 아래에서 만난다
LID_DOWN, LOW_UP = cfg.get('blinkDown', 37) * es, cfg.get('blinkUp', -11) * es
def bk_to(rest, peak, close=(0.15, 0, 0.3, 1)):
    ks = [kf(rest, 0)]
    for st in (150, 262, 279): ks += [kf(rest, st, (0.5, 0, 0.9, 0.6)), kf(peak, st + 5, close), kf(rest, st + 13)]
    return ks
FLAT = cfg.get('blinkFlat', 0.62)  # 다 감았을 때 눈꺼풀 곡선이 펴지는 정도 (세로 비율)
for s in ('left', 'right'):
    blink.append(trk(idof(f'blink-{s}'), 14, bk(LID_DOWN)))
    blink.append(trk(idof(f'blink-{s}'), 17, bk_to(1, FLAT)))
    if has(f'lowblink-{s}'): blink.append(trk(idof(f'lowblink-{s}'), 14, bk(LOW_UP)))
    if has(f'crease-blink-{s}'):
        blink.append(trk(idof(f'crease-blink-{s}'), 14, bk(LID_DOWN * 0.12)))
        blink.append(trk(idof(f'crease-blink-{s}'), 18, bk_to(1, 0)))
blink_rest = el('LinearAnimation', name='blink-rest', duration=1, fps=60, id=nid())
for s_ in ('left', 'right'):
    blink_rest.append(trk(idof(f'blink-{s_}'), 14, [kf(0)])); blink_rest.append(trk(idof(f'blink-{s_}'), 17, [kf(1)]))
    if has(f'crease-blink-{s_}'): blink_rest.append(trk(idof(f'crease-blink-{s_}'), 14, [kf(0)])); blink_rest.append(trk(idof(f'crease-blink-{s_}'), 18, [kf(1)]))
    if has(f'lowblink-{s_}'): blink_rest.append(trk(idof(f'lowblink-{s_}'), 14, [kf(0)]))
breathe = el('LinearAnimation', name='breathe', duration=252, loopValue='loop', fps=60, id=nid())
SINE = (0.45, 0, 0.55, 1)
breathe.append(trk(idof('torso'), 17, [kf(1, 0, SINE), kf(1 + cfg.get('breath', 0.012), 139, SINE), kf(1, 252)]))
ib = float(by('head-inner').get('y'))
breathe.append(trk(idof('head-inner'), 14, [kf(ib, 0, SINE), kf(ib, 13, SINE), kf(ib - 2.5 * hs, 152, SINE), kf(ib, 252)]))

sm = el('StateMachine', name='Face', id=nid())
def simple_layer(name, anim):
    L = el('StateMachineLayer', name=name, id=nid()); L.append(el('AnyState', x=200, y=-120)); L.append(el('ExitState', x=400, y=-120))
    s = el('AnimationState', x=200, y=100, animationId=anim.get('id'), id=nid())
    e = el('EntryState', x=0, y=0); e.append(el('StateTransition', stateToId=s.get('id'))); L.append(e); L.append(s); return L
def cond(k):
    c = el('TransitionViewModelCondition', opValue='equal'); lc = el('TransitionPropertyViewModelComparator'); bp = el('BindablePropertyEnum')
    bp.append(el('DataBindContext', sourcePathIds=f"{vm.get('id')}-{prop.get('id')}", propertyKey='637'))
    lc.append(bp); c.append(lc); c.append(el('TransitionValueEnumComparator', value=ev[k])); return c
def enum_layer(name, target_of, dur):
    L = el('StateMachineLayer', name=name, id=nid())
    anyst = el('AnyState', x=0, y=-160); L.append(anyst); L.append(el('ExitState', x=900, y=-160))
    states = {}
    for i, k in enumerate(EXPR):
        an = target_of(k)
        states[k] = el('AnimationState', x=-560 + i * 180, y=160, animationId=an.get('id'), reset='true', id=nid())
    e = el('EntryState', x=-300, y=-160); e.append(el('StateTransition', stateToId=states['neutral'].get('id'))); L.append(e)
    for k in EXPR:
        tr = el('StateTransition', stateToId=states[k].get('id'), duration=dur, interpolationType='cubic', enableEarlyExit='true')
        tr.append(el('CubicEaseInterpolator', x1=0.22, y1=1, x2=0.36, y2=1)); tr.append(cond(k)); anyst.append(tr)
    for k in EXPR: L.append(states[k])
    return L
GLARE = ('frown', 'angry', 'sulky')
def blink_layer():
    # 노려볼 때(찡그림·분노·삐짐)는 깜빡이지 않는다 — 사선 눈꺼풀과 속눈썹이 어긋나 보이고, 노려보는 눈은 원래 깜빡임이 줄어든다
    L = el('StateMachineLayer', name='Blink', id=nid())
    anyst = el('AnyState', x=0, y=-160); L.append(anyst); L.append(el('ExitState', x=600, y=-160))
    on = el('AnimationState', x=-150, y=160, animationId=blink.get('id'), id=nid())
    off = el('AnimationState', x=150, y=160, animationId=blink_rest.get('id'), id=nid())
    e = el('EntryState', x=-300, y=-160); e.append(el('StateTransition', stateToId=on.get('id'))); L.append(e)
    for k in EXPR:
        tr = el('StateTransition', stateToId=(off if k in GLARE else on).get('id'), duration=120, enableEarlyExit='true')
        tr.append(cond(k)); anyst.append(tr)
    L.append(on); L.append(off); return L
sm.append(simple_layer('Breathe', breathe)); sm.append(blink_layer())
sm.append(enum_layer('Expression', lambda k: poses[k], 480))
sm.append(enum_layer('Effects', lambda k: fxs.get(k, fxs['none']), 300))
art.set('defaultStateMachineId', sm.get('id'))
first_node = next(c for c in art if c.tag == 'Node'); art.insert(list(art).index(first_node), sm)
for a in [breathe, blink, blink_rest] + [poses[k] for k in EXPR] + list(fxs.values()): art.append(a)
ET.indent(t, space='    '); t.write(p, encoding='unicode'); print('poses ok')
