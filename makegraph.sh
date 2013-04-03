old=.$$.old
new=.$$.new
FILE=$$.txt

#Pass changed file as $1
generate(){
  in="$1"
  source="$in".src
  out=${1%.*}.png
  rm -f "$out"
  #extract generator from source and put reminder in new file...
  generator=`head -1 "$in"`
  sed '1 d' $in >"$source"
  case "$generator" in
	actdiag)
  		node parse.js "$source" "$generator" |actdiag -Tpng -o $out - && open "$out" &
	;;
	digraph)
  		node parse.js "$source" "$generator" |dot -Tpng -o $out && open "$out" &
	;;
	*)
  		node parse.js "$in" "$generator" |dot -Tpng -o $out && open "$out" &
	;;
  esac
}

beginScanning(){
  touch ${FILE}
  stat -f"%N %m%b%z%v" ${FILE}>$old
  while [ 1 ]; do
    stat -f"%N %m%b%z%v" ${FILE}>$new
    for c in `cat $new $old|sort|uniq -u|cut -d" " -f1`;do	
      #n=${c%.*}.png
      #mscgen -T png -i $c && open  $n &
      generate "$c"
    done
    cp $new $old
    rm -f $new
    sleep 1
  done
}

beginScanning &
SCANPID=$!
nano ${FILE}

rm $old
rm $new
kill $SCANPID

