# 세 캐릭터를 원본 RML에서 리그·삐진 입·포즈까지 다시 만든다
set -e
S=$(cd "$(dirname "$0")" && pwd)
R=$S/../..
mk(){ name=$1 base=$2 client=$3 scale=$4 lip=$5 inner=$6
  cd $R/$name && cp ../_source/$base scene.rml
  python3 $S/rig2.py scene.rml $S/$name.json >/dev/null
  sed -i '' "s/'[0-9]:%d' % (7000/'$client:%d' % (7000/" $S/pout.py
  python3 $S/pout.py scene.rml $scale $lip $inner >/dev/null
  python3 $S/poses2.py scene.rml $S/$name.json >/dev/null
  rive . --verify 2>&1 | tail -1
  for e in neutral happy frown angry sad love sulky shy; do rive . --screenshot=build/x-$e.png --data=expression=$e --advance=60 >/dev/null 2>&1; done
}
mk chloe chloe.base.rml 1 1 FF762A16 FFB4533A
mk marco marco.base.rml 2 1.13 FF5C321C FF9C4A2E
mk teddy teddy.base.rml 3 1.55 FF762A16 FFB4533A

# 앱이 재생하는 표정 데이터로 내보낸다
OUT=$R/../../src/features/conversation/ui/character/expressions
for c in chloe marco teddy; do python3 $S/rml2svg.py $R/$c/scene.rml $OUT/$c.json; done
