<?
//print_r($_SERVER);
$postText = trim(file_get_contents('php://input'));
file_put_contents("/Users/ede/jison/state/localstorage.json",$postText);
?>
