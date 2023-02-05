<?php
function _sanitize($ip)
{
    return str_replace(array(':', '.', '/'), array('_', '_', '_'), $ip);
}

function get_safe_ip()
{
    return _sanitize($_SERVER['REMOTE_ADDR']);
}