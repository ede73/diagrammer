<?php
//print_r($_SERVER);

function sanitize() {
}

function get_safe_ip() {
  $ip = $_SERVER['REMOTE_ADDR'];
  return str_replace($ip, array(':'), array('_'));
}

$ip = get_safe_ip();

$postText = trim(file_get_contents('php://input'));

if (FALSE===file_put_contents("./localstorage_{$ip}.json", $postText)) {
  http_response_code(500);
}
?>
