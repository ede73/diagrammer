<?
$file="./localstorage_".$_SERVER['REMOTE_ADDR'].".json";
if (file_exists($file)){
	echo file_get_contents($file);
}else{
	echo file_get_contents("./localstorage.json");
}
?>
