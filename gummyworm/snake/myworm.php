<?php

// error_reporting(-1);
// ini_set('display_errors','On');

$name = $_GET["name"];
// $type = $_GET["type"];
$inverted = $_GET["invert"];
$style = $_GET["style"];
$left = $_GET["leftC"];
$right = $_GET["rightC"];
$up = $_GET["upC"];
$down = $_GET["downC"];

$db = mysql_connect ("cis.gvsu.edu", "gomerc", "gomerc8234");
mysql_select_db("gomerc");

if ($name != null && $style != null && $inverted != null && $style != null && $left != null && $right != null && $up != null && $down != null) {
	$query = "replace into worms (name,inverted,style,leftC,rightC,upC,downC) values (\"" . $name . "\", \"" . $inverted . "\", \"" . $style . "\", \"" . $left . "\", \"" . $right . "\", \"" . $up . "\", \"" . $down . "\");";
	$res = mysql_query($query);
	if ($res) echo $res;
	else echo mysql_error();
	header("Location: http://cis.gvsu.edu/~gomerc/gummyworm.html");
}

$deleteIt = "drop table worms;";
$create = "create table worms (name varchar(100), inverted varchar(5), style varchar(100), leftC varchar(50), rightC varchar(10), upC varchar(10), downC varchar(10), primary key (name));";
//echo $query . "</br>";
//echo $create . "</br></br>";
/*
$res = mysql_query($deleteIt);
if ($res) echo $res;
else echo mysql_error();
*/
/*
$res = mysql_query($create);
if ($res) echo $res;
else echo mysql_error();
*/

if ($type == null && $name != null && $name != "your-name-here") {
	$res = mysql_query("select * from worms where name = \"" . $name . "\"");
	if ($res) {
		$response = '{ "prefs" : { ';
		$row = mysql_fetch_array($res);
		$response .= ' "name" : "' .$row["name"] . '", "inverted" : "' . $row["inverted"] . '", "style" : "' . $row["style"] . '", "leftC" : "' . $row["leftC"] . '", "rightC" : "' . $row["rightC"] . '", "downC" : "' . $row["downC"] . '", "upC" : "' . $row["upC"] . '" } }' ;
		echo $response;
	}
} else if ($name == "your-name-here")
	echo '{ "name" : "your name here", "inverted" : "false", "style" : "mario", "upC" : "w", "leftC" : "a", "downC" : "s", "rightC" : "d" }';
mysql_close($db);

?>
