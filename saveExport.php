<?
//print_r($_SERVER);
$postText = trim(file_get_contents('php://input'));
file_put_contents("./localstorage.json",$postText);
?>
