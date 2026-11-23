# Rive 장면(RML)을 정적 SVG + 애니메이션·상태 JSON으로 바꾸는 변환기 — 웹에서 Rive 런타임 없이 재생하기 위함
# 사용: python3 rml2svg.py scene.rml out.json
import sys, math, json, xml.etree.ElementTree as ET

src, out = sys.argv[1], sys.argv[2]
root = ET.parse(src).getroot()
art = root.find('Artboard')
W, H = float(art.get('width')), float(art.get('height'))

f = lambda e, k, d=0.0: float(e.get(k, d))
seq = [0]
def svg_id(e):
    # Rive id가 있으면 그것으로, 없으면 새로 — 애니메이션이 id로 대상을 찾는다
    rid = e.get('id')
    if rid: return 'r' + rid.replace(':', '_')
    seq[0] += 1; return f'g{seq[0]}'

def col(v):
    v = v.upper(); return '#' + v[2:], round(int(v[:2], 16) / 255, 4)

def handles(v):
    x, y = f(v, 'x'), f(v, 'y')
    t = v.tag
    if t == 'CubicDetachedVertex':
        return ((x + math.cos(f(v, 'inRotation')) * f(v, 'inDistance'), y + math.sin(f(v, 'inRotation')) * f(v, 'inDistance')),
                (x + math.cos(f(v, 'outRotation')) * f(v, 'outDistance'), y + math.sin(f(v, 'outRotation')) * f(v, 'outDistance')))
    if t == 'CubicAsymmetricVertex':
        r = f(v, 'rotation'); return ((x - math.cos(r) * f(v, 'inDistance'), y - math.sin(r) * f(v, 'inDistance')), (x + math.cos(r) * f(v, 'outDistance'), y + math.sin(r) * f(v, 'outDistance')))
    if t == 'CubicMirroredVertex':
        r, d = f(v, 'rotation'), f(v, 'distance'); return ((x - math.cos(r) * d, y - math.sin(r) * d), (x + math.cos(r) * d, y + math.sin(r) * d))
    return (x, y), (x, y)

def n(v): return f'{v:.2f}'.rstrip('0').rstrip('.') if abs(v) > 1e-9 else '0'

def points_d(pp, xf=None):
    xf = xf or (lambda x, y: (x, y))
    vs = [v for v in pp if v.tag.endswith('Vertex')]
    closed = pp.get('isClosed', 'true') == 'true'
    if not vs: return ''
    # 둥근 모서리(StraightVertex radius)는 모서리 앞뒤 두 점 + 이차 곡선으로
    segs = []  # (in_ctrl, start_pt, corner(None|pt), end_pt, out_ctrl)
    cnt = len(vs)
    for i, v in enumerate(vs):
        x, y = f(v, 'x'), f(v, 'y'); r = f(v, 'radius')
        if v.tag == 'StraightVertex' and r > 0 and (closed or 0 < i < cnt - 1):
            a, b = vs[(i - 1) % cnt], vs[(i + 1) % cnt]
            def toward(o):
                dx, dy = f(o, 'x') - x, f(o, 'y') - y; L = math.hypot(dx, dy) or 1; rr = min(r, L / 2)
                return (x + dx / L * rr, y + dy / L * rr)
            A, B = toward(a), toward(b)
            segs.append((xf(*A), xf(*A), xf(x, y), xf(*B), xf(*B)))
        else:
            hi, ho = handles(v); segs.append((xf(*hi), xf(x, y), None, xf(x, y), xf(*ho)))
    d = f'M{n(segs[0][1][0])} {n(segs[0][1][1])}'
    if segs[0][2]: d += f'Q{n(segs[0][2][0])} {n(segs[0][2][1])} {n(segs[0][3][0])} {n(segs[0][3][1])}'
    rng = range(1, cnt + 1) if closed else range(1, cnt)
    for j in rng:
        p, q = segs[j - 1], segs[j % cnt]
        d += f'C{n(p[4][0])} {n(p[4][1])} {n(q[0][0])} {n(q[0][1])} {n(q[1][0])} {n(q[1][1])}'
        if q[2] and (j < cnt or True):
            if j == cnt: break
            d += f'Q{n(q[2][0])} {n(q[2][1])} {n(q[3][0])} {n(q[3][1])}'
    return d + ('Z' if closed else '')

K = 0.5523
def geom_d(shape, xf=None):
    out = []
    for c in shape:
        if c.tag == 'PointsPath': out.append(points_d(c, xf))
        elif c.tag in ('Ellipse', 'Rectangle'):
            w, h = f(c, 'width'), f(c, 'height'); ox, oy = f(c, 'originX', 0.5), f(c, 'originY', 0.5)
            cx, cy = w * (0.5 - ox), h * (0.5 - oy)
            P = xf or (lambda x, y: (x, y))
            if c.tag == 'Ellipse':
                rx, ry = w / 2, h / 2
                pts = [(cx + rx, cy), (cx, cy + ry), (cx - rx, cy), (cx, cy - ry)]
                ctr = [((cx + rx, cy + ry * K), (cx + rx * K, cy + ry)), ((cx - rx * K, cy + ry), (cx - rx, cy + ry * K)),
                       ((cx - rx, cy - ry * K), (cx - rx * K, cy - ry)), ((cx + rx * K, cy - ry), (cx + rx, cy - ry * K))]
                q = P(*pts[0]); d = f'M{n(q[0])} {n(q[1])}'
                for i in range(4):
                    a, b = P(*ctr[i][0]), P(*ctr[i][1]); e2 = P(*pts[(i + 1) % 4])
                    d += f'C{n(a[0])} {n(a[1])} {n(b[0])} {n(b[1])} {n(e2[0])} {n(e2[1])}'
                out.append(d + 'Z')
            else:
                cs = [P(cx - w / 2, cy - h / 2), P(cx + w / 2, cy - h / 2), P(cx + w / 2, cy + h / 2), P(cx - w / 2, cy + h / 2)]
                out.append('M' + 'L'.join(f'{n(a)} {n(b)}' for a, b in cs) + 'Z')
    return ''.join(out)

def local_xf(e):
    # 도형 자기 변환(이동·회전·크기)을 점에 굽는다 — 여러 조각을 부모 좌표 한 경로로 합칠 때
    x, y, r, sx, sy = f(e, 'x'), f(e, 'y'), f(e, 'rotation'), f(e, 'scaleX', 1), f(e, 'scaleY', 1)
    c, s_ = math.cos(r), math.sin(r)
    return lambda px, py: (x + c * px * sx - s_ * py * sy, y + s_ * px * sx + c * py * sy)

def tf(e):
    x, y, r, sx, sy = f(e, 'x'), f(e, 'y'), f(e, 'rotation'), f(e, 'scaleX', 1), f(e, 'scaleY', 1)
    parts = []
    if x or y: parts.append(f'translate({n(x)} {n(y)})')
    if r: parts.append(f'rotate({n(math.degrees(r))})')
    if sx != 1 or sy != 1: parts.append(f'scale({n(sx)} {n(sy)})')
    return ' '.join(parts)

defs = []
clips = []          # 실행 중 위치를 맞출 클립: {clip, ref, pieces:[{el, src}]}
morph = {}          # 꼭짓점이 움직이는 도형: shapeId -> {closed, verts:[{id,type,...}]}
targets = {}        # Rive id -> {el, kind, ...}
filt_seq = [0]; grad_seq = [0]; clip_seq = [0]
id_index = {e.get('id'): e for e in art.iter() if e.get('id')}

def shape_pieces(e):
    return [e] if e.tag == 'Shape' else [s for s in e.iter('Shape')]

def emit(e):
    tag = e.tag
    if tag not in ('Node', 'Shape'): return ''
    sid = svg_id(e)
    if e.get('id'): targets[e.get('id')] = {'el': sid, 'kind': 'xf', 'base': {k: f(e, k, 1 if k.startswith('scale') else (1 if k == 'opacity' else 0)) for k in ('x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity')}}
    attrs = f' id="{sid}"'
    t = tf(e)
    if t: attrs += f' transform="{t}"'
    if e.get('opacity') is not None and f(e, 'opacity', 1) != 1: attrs += f' opacity="{n(f(e, "opacity", 1))}"'
    inner = ''
    if tag == 'Shape':
        d = geom_d(e)
        pp = e.find('PointsPath')
        if pp is not None:
            vs = [v for v in pp if v.tag.endswith('Vertex')]
            if any(v.get('id') for v in vs):
                morph[sid] = {'closed': pp.get('isClosed', 'true') == 'true', 'verts': []}
                for v in vs:
                    vd = {'t': v.tag, **{k: f(v, k) for k in ('x', 'y', 'rotation', 'distance', 'inRotation', 'inDistance', 'outRotation', 'outDistance')}}
                    morph[sid]['verts'].append(vd)
                    if v.get('id'): targets[v.get('id')] = {'el': sid, 'kind': 'vert', 'i': len(morph[sid]['verts']) - 1}
        paints = [c for c in e if c.tag in ('Fill', 'Stroke')]
        if not paints:
            inner += f'<path d="{d}" fill="none"/>'
        for pi, p in enumerate(paints):
            pa = ''
            sc = p.find('SolidColor'); lg = p.find('LinearGradient')
            if sc is not None:
                c_, a_ = col(sc.get('colorValue'))
                paint = c_
            elif lg is not None:
                grad_seq[0] += 1; gid = f'{sid}_gr{grad_seq[0]}'
                stops = ''.join(f'<stop offset="{n(f(s, "position"))}" stop-color="{col(s.get("colorValue"))[0]}" stop-opacity="{col(s.get("colorValue"))[1]}"/>' for s in lg.findall('GradientStop'))
                defs.append(f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{n(f(lg, "startX"))}" y1="{n(f(lg, "startY"))}" x2="{n(f(lg, "endX"))}" y2="{n(f(lg, "endY"))}">{stops}</linearGradient>')
                paint, a_ = f'url(#{gid})', 1
            else:
                paint, a_ = 'none', 1
            if p.tag == 'Fill':
                pa = f' fill="{paint}"' + (f' fill-opacity="{a_}"' if a_ != 1 else '') + ' stroke="none"'
                if p.get('fillRule') == 'evenOdd': pa += ' fill-rule="evenodd"'
            else:
                th = f(p, 'thickness', 1)
                cap = {'round': 'round', 'square': 'square', '1': 'round', '2': 'square'}.get(p.get('cap', 'butt'), 'butt')
                join = {'round': 'round', 'bevel': 'bevel', '1': 'round', '2': 'bevel'}.get(p.get('join', 'miter'), 'miter')
                pa = f' fill="none" stroke="{paint}"' + (f' stroke-opacity="{a_}"' if a_ != 1 else '') + f' stroke-width="{n(th)}" stroke-linecap="{cap}" stroke-linejoin="{join}"'
                if p.get('id'): targets[p.get('id')] = {'el': sid, 'kind': 'stroke', 'i': pi}
            fe = p.find('Feather')
            if fe is not None:
                filt_seq[0] += 1; fid = f'{sid}_bl{filt_seq[0]}'
                defs.append(f'<filter id="{fid}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="{n(f(fe, "strength", 12) / 2)}"/></filter>')
                pa += f' filter="url(#{fid})"'
            inner += f'<path data-p="{pi}" d="{d}"{pa}/>'
    else:
        kids = [c for c in e if c.tag in ('Node', 'Shape')]
        inner = ''.join(emit(c) for c in reversed(kids))  # Rive는 앞 자식이 위 — SVG는 뒤가 위
    # 클립: 감싸는 g마다 하나씩 걸어 교집합을 만든다
    for cs in [c for c in e if c.tag == 'ClippingShape']:
        clip_seq[0] += 1; cid = f'{sid}_cl{clip_seq[0]}'; wid = f'{cid}_w'
        srcn = id_index[cs.get('sourceId')]
        pieces = []
        rule = ' clip-rule="evenodd"' if cs.get('fillRule') == 'evenOdd' else ''
        body = ''
        if rule and srcn.tag == 'Node':
            pid = f'{cid}_0'
            d = ''.join(geom_d(pc, local_xf(pc)) for pc in srcn.findall('Shape'))
            body += f'<path id="{pid}" d="{d}"{rule}/>'
            pieces.append({'el': pid, 'src': None, 'srcNode': srcn})
        else:
            for k, pc in enumerate(shape_pieces(srcn)):
                pid = f'{cid}_{k}'
                body += f'<path id="{pid}" d="{geom_d(pc)}"{rule}/>'
                pieces.append({'el': pid, 'src': svg_id(pc) if pc.get('id') else None, 'srcNode': pc})
        defs.append(f'<clipPath id="{cid}" clipPathUnits="userSpaceOnUse">{body}</clipPath>')
        inner = f'<g id="{wid}" clip-path="url(#{cid})">{inner}</g>'
        clips.append({'ref': wid, 'pieces': pieces})
    return f'<g{attrs}>{inner}</g>'

# 클립 원본 도형이 id 없이 그려지면 위치를 못 찾으므로, 먼저 모든 원본에 id를 붙인다
for cs in art.iter('ClippingShape'):
    for pc in shape_pieces(id_index[cs.get('sourceId')]) + [id_index[cs.get('sourceId')]]:
        if not pc.get('id'):
            seq[0] += 1; pc.set('id', f'9:{seq[0]}'); id_index[pc.get('id')] = pc
top = [c for c in art if c.tag in ('Node', 'Shape')]
body = ''.join(emit(c) for c in reversed(top))
for cl in clips:
    for pc in cl['pieces']:
        pc['src'] = svg_id(pc.pop('srcNode'))
# 원래 캐릭터 좌표로 되돌린다 — 앱이 넘기는 viewBox(얼굴 자르기 등)가 원본 SVG 기준이다
vb = next((c for c in top if c.get('name') == 'ViewBox'), None)
ox, oy = (-f(vb, 'x'), -f(vb, 'y')) if vb is not None else (0, 0)
view_box = f'{n(ox)} {n(oy)} {n(W)} {n(H)}'
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}"><defs>{"".join(defs)}</defs><g transform="translate({n(ox)} {n(oy)})">{body}</g></svg>'
names = {}
for e in art.iter():
    if e.tag in ('Node', 'Shape') and e.get('name') and e.get('id') and e.get('id') in targets:
        names.setdefault(e.get('name'), e.get('id'))

# 애니메이션
PK = {'13': 'x', '14': 'y', '15': 'rotation', '16': 'scaleX', '17': 'scaleY', '18': 'opacity', '24': 'x', '25': 'y', '82': 'rotation', '83': 'distance', '47': 'thickness'}
anims = {}
for a in art.findall('LinearAnimation'):
    tracks = []
    for ko in a.findall('KeyedObject'):
        tg = targets.get(ko.get('objectId'))
        if not tg: continue
        for kp in ko.findall('KeyedProperty'):
            prop = PK.get(kp.get('propertyKey'))
            if not prop: continue
            keys = []
            for kf in kp.findall('KeyFrameDouble'):
                ce = kf.find('CubicEaseInterpolator')
                keys.append([int(kf.get('frame', 0)), f(kf, 'value'), kf.get('interpolationType', 'hold'),
                             [f(ce, 'x1', .42), f(ce, 'y1', 0), f(ce, 'x2', .58), f(ce, 'y2', 1)] if ce is not None else None])
            tracks.append({'t': ko.get('objectId'), 'p': prop, 'k': keys})
    anims[a.get('id')] = {'name': a.get('name'), 'dur': int(a.get('duration', 60)), 'fps': int(a.get('fps', 60)), 'loop': a.get('loopValue') == 'loop', 'tracks': tracks}

# 상태머신: 층마다 기본 애니메이션과 "표정 = X 이면 이 애니메이션" 규칙
enum_keys = {v.get('id'): v.get('key') for v in root.iter('DataEnumValue')}
layers = []
sm = art.find('StateMachine')
for L in sm.findall('StateMachineLayer'):
    states = {s.get('id'): s for s in L if s.tag == 'AnimationState'}
    entry = L.find('EntryState').find('StateTransition').get('stateToId')
    rules = {}
    anys = L.find('AnyState')
    for tr in (anys.findall('StateTransition') if anys is not None else []):
        c = tr.find('.//TransitionValueEnumComparator')
        if c is None: continue
        ce = tr.find('CubicEaseInterpolator')
        st = states[tr.get('stateToId')]
        rules[enum_keys[c.get('value')]] = {'anim': st.get('animationId'), 'reset': st.get('reset') == 'true', 'dur': int(tr.get('duration', 0)),
                                            'ease': [f(ce, 'x1'), f(ce, 'y1'), f(ce, 'x2'), f(ce, 'y2')] if ce is not None else None}
    layers.append({'name': L.get('name'), 'default': states[entry].get('animationId'), 'rules': rules})

json.dump({'viewBox': view_box, 'names': names, 'svg': svg, 'targets': targets, 'morph': morph, 'clips': clips, 'anims': anims, 'layers': layers,
           'expressions': [v.get('key') for v in root.iter('DataEnumValue')]}, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print('ok', out, f'{len(svg) // 1024}KB svg', len(anims), 'anims', len(clips), 'clips')
