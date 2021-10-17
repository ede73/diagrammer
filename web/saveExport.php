<?php

function sanitize($ip)
{
    return str_replace(array(':', '.', '/'), array('_', '_', '_'), $ip);
}

function get_safe_ip()
{
    return sanitize($_SERVER['REMOTE_ADDR']);
}

$postText = trim(file_get_contents('php://input'));

$ip = get_safe_ip();
if (false === file_put_contents("./localstorage_{$ip}.json", $postText)) {
    http_response_code(500);
}
