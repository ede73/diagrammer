<?php
$file = "./localstorage_" . $_SERVER['REMOTE_ADDR'] . ".json";
if (!file_exists($file)) {
  $file = "./localstorage.json";
}

if (file_exists($file)) {
  error_log('Serve export:' . $file);
  echo file_get_contents($file);
} else {
  error_log('Export file ' . $file . " doesnt exist");
}
