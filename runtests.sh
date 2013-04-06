x=${1:-dot}
test(){
./t.sh $1 $x
png=${1%.*}.png
diff $png ref/$png
[ $? -ne 0 ] && echo "ERROR: at $1, image $png and ref/$png differ"
}

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
