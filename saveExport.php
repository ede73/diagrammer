<?
//print_r($_SERVER);
$postText = trim(file_get_contents('php://input'));
if (FALSE===file_put_contents("./localstorage.json",$postText)){
http_response_code(500);
return;
}
?>
