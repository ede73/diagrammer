<?php
require('safeip.php');
$ip = get_safe_ip();

$file = "./exported/localstorage_${ip}.json";
if (!file_exists($file)) {
  $file = "./exported/localstorage.json";
}

if (file_exists($file)) {
  error_log('Serve export:' . $file);
  echo file_get_contents($file);
} else {
  error_log('Export file ' . $file . " doesnt exist");
}