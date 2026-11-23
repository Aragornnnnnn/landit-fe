# 삐진 입(오므려 내민 입술)을 입 노드에 얹는 일회성 추가 — 사용: pout.py scene.rml 배율 입술색 안쪽색
import sys, math, xml.etree.ElementTree as ET
p, s, lip, inner = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4]
t = ET.parse(p); art = t.getroot().find('Artboard')
mouth = next(e for e in art.iter('Node') if e.get('name') == 'mouth')
for old in [c for c in mouth if c.get('name') == 'mouth-pout']: mouth.remove(old)
def el(tag, **a):
    e = ET.Element(tag); [e.set(k, str(v)) for k, v in a.items()]; return e
def V(x, y, ir, idist, orr, od):
    return el('CubicDetachedVertex', x=round(x * s, 3), y=round(y * s, 3), inRotation=round(ir, 4), inDistance=round(idist * s, 3), outRotation=round(orr, 4), outDistance=round(od * s, 3))
pi = math.pi
node = el('Node', x=round(5 * s, 2), y=round(1 * s, 2), rotation='-0.1', opacity='0', name='mouth-pout', id='3:%d' % (7000 + int(s * 10)))
# 입술 외곽 — 윗입술은 가운데가 살짝 패인 활 모양, 아랫입술은 앞으로 볼록 튀어나온다
lips = el('Shape', name='pout-lips')
pp = el('PointsPath', isClosed='true', name='Path')
pp.append(V(-8, 0.5, pi / 2, 2.2, -pi / 2 + 0.35, 2.2))       # 왼쪽 입꼬리
pp.append(V(-3, -4, pi, 2.4, 0, 1.6))                         # 윗입술 왼봉
pp.append(V(0, -2.6, pi - 0.5, 1.2, 0.5, 1.2))                # 인중 아래 패인 곳
pp.append(V(3.2, -4.3, pi, 1.6, 0, 2.6))                      # 윗입술 오른봉
pp.append(V(8.5, 0, -pi / 2 - 0.35, 2.4, pi / 2, 2.4))        # 오른쪽 입꼬리
pp.append(V(1, 5.6, 0, 5, pi, 5.2))                           # 아랫입술 불룩
lips.append(pp)
f = el('Fill', name='Fill'); f.append(el('SolidColor', colorValue=inner, name='Color')); lips.append(f)
st = el('Stroke', thickness=round(1.6 * s, 2), join='round', name='Stroke'); st.append(el('SolidColor', colorValue=lip, name='Color')); lips.append(st)
# 입술 사이 다문 선 — 가운데가 살짝 내려간다
seam = el('Shape', name='pout-seam')
pp = el('PointsPath', isClosed='false', name='Path')
pp.append(V(-6.5, 0.6, 0, 0, -0.2, 2.5)); pp.append(V(0.5, 0.9, pi, 2.5, 0, 2.5)); pp.append(V(7, 0.3, pi + 0.2, 2.5, 0, 0))
seam.append(pp)
st = el('Stroke', thickness=round(1.5 * s, 2), cap='round', name='Stroke'); st.append(el('SolidColor', colorValue=lip, name='Color')); seam.append(st)
# 아랫입술 윤기
gl = el('Shape', x=round(2 * s, 2), y=round(3.4 * s, 2), name='pout-gloss')
gl.append(el('Ellipse', width=round(4.2 * s, 2), height=round(1.6 * s, 2), name='Path'))
f = el('Fill', name='Fill'); f.append(el('SolidColor', colorValue='99FFFFFF', name='Color')); gl.append(f)
for c in (gl, seam, lips): node.append(c)
mouth.insert(0, node)
ET.indent(t, space='    '); t.write(p, encoding='unicode'); print('pout ok')
