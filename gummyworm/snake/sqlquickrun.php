<?php

$db = mysql_connect ("cis.gvsu.edu", "gomerc", "gomerc8234");
mysql_select_db("gomerc");
$res = mysql_query("delete from wormscores where name='SCRIPPS!'");
mysql_close($db);

?>