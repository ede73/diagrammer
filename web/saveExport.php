<?php
require('safeip.php');

$postText = trim(file_get_contents('php://input'));

$ip = get_safe_ip();
mkdir("./exported");
if (false === file_put_contents("./exported/localstorage_{$ip}.json", $postText)) {
    http_response_code(500);
}