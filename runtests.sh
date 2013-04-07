test(){
 ./t.sh silent $1 $x
 png=${1%.*}_${x}.png
 diff $png ref/$x/$png
 [ $? -ne 0 ] && echo "ERROR: at $1, image $png and ref/$x/$png differ" >&2 open $png && open ref/$x/$png
}

tests=${1:-dot actdiag blockdiag}

for test in $tests; do
x=$test
test state.txt
test state2.txt
test state3.txt
test state4.txt
test state5.txt
test state6.txt
test state7.txt
test state8.txt
test state9.txt
test state10.txt
test state11.txt
test state12.txt
done
