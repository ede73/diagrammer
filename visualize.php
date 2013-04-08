<?
//print_r($_SERVER);
$postText = trim(file_get_contents('php://input'));
file_put_contents("/Users/ede/jison/state/post.txt",$postText);
//exec("");
exec("/usr/local/bin/dot -Tpng -o result.png post.txt");
//echo $postText;

//header("Content-Type: image/png");
//passthru("cat state_dot.png");

echo "result.png";
?>
