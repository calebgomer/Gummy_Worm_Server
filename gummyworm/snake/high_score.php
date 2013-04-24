<?php

// error_reporting(-1);
// ini_set('display_errors','On');

$name = $_POST["player_name"];
$score = $_POST["player_score"];
$apple = $_POST["apple"];
$blueberry = $_POST["blueberry"];
$maxApple = $_GET["maxa"];
$maxBlueberry = $_GET["maxb"];
$all = $_GET["all"];
$rightNow = $_POST["now"];
$actualNow = time();
if ($rightNow)
	$diff = $actualNow - $rightNow;
else $diff = 9001;


/**check for hackings**/
$pos = strpos($name, ";");
if ($pos === false) { /*good*/ } 
else { echo "<h1>Very funny...</h1>"; exit(); }

$pos = strpos($score, ";");
if ($pos === false) { /*good*/ } 
else { echo "<h1>Very funny...</h1>"; exit(); }

$pos = strpos($apple, ";");
if ($pos === false) { /*good*/ } 
else { echo "<h1>Very funny...</h1>"; exit(); }

$pos = strpos($blueberry, ";");
if ($pos === false) { /*good*/ } 
else { echo "<h1>Very funny...</h1>"; exit(); }

if ($score != $apple + $blueberry) {
	echo "<h1>Learn to count...</h1>"; exit();
}




$db = mysql_connect ("cis.gvsu.edu", "gomerc", "gomerc8234");
mysql_select_db("gomerc");
// $res = mysql_query("drop table wormscores");
// $res = mysql_query("create table wormscores (id int not null auto_increment, name varchar(50), score int, apple int, blueberry int, primary key (id));");
if (!is_null($maxApple)) {
	$response = '{ "max" : ';
	$rows = mysql_query("select name,apple from wormscores where apple = (select max(apple) from wormscores)");
	if ($rows)	{
		$row = mysql_fetch_array($rows);
		$response =  $response . $row['apple'] . ', "name" : "' . $row['name'] .'" }';
		echo $response;
	}
	else echo mysql_error();
} else if (!is_null($maxBlueberry)) {
	$response = '{ "max" : ';
	$rows = mysql_query("select name,blueberry from wormscores where blueberry = (select max(blueberry) from wormscores)");
	if ($rows)	{
		$row = mysql_fetch_array($rows);
		$response =  $response . $row['blueberry'] . ', "name" : "' . $row['name'] . '" }';
		echo $response;
	}
	else echo mysql_error();
} else if (is_null($name) || is_null($score) || is_null($apple) || is_null($blueberry)) {	
	$response = '{ "scores" : [ ';
	$query = "select name, score, apple, blueberry from wormscores order by score desc";
	if (!$all)
		$query = $query . " limit 5";
	$rows = mysql_query($query);
	if ($rows) {
		while ($row = mysql_fetch_array($rows)) {
			$response = $response . '{ "player_name" : "' . $row['name'] . '", "score" : ' . $row['score'] . ', "apple" : ' . $row['apple'] . ', "blueberry" : ' . $row['blueberry'] . ' },';
		}
		$response = substr($response,0,-1); //chop off last comma
		$response = $response . ' ] }';
		echo $response;
	} else {
		echo ' {} ';
	}
} else if ($score > 0 && $score < 1000) {
	if ($name == "your name here" || $name == "")
        	$name = "anonymous";
    $res = mysql_query("insert into wormscores (name,score, apple, blueberry) values (\"" . $name . "\"," . $score . "," . $apple . "," . $blueberry . ");");//create table wormscores (id int not null auto_increment, name varchar(50), score int, primary key (id));");
    if ($res) {}
    else {echo mysql_error();}
    header("Location: http://cis.gvsu.edu/~gomerc/gummyworm.html");
} else if ($score > 1000) {
	echo "You're funny!";
} else {
	header("Location: http://cis.gvsu.edu/~gomerc/gummyworm.html");
}

mysql_close($db);

?>