<?php

// error_reporting(-1);
// ini_set('display_errors','On');

$url= "http://www.cis.gvsu.edu/~gomerc/snake/high_score.php?all=true";
$json = file_get_contents($url);
$data = json_decode($json, TRUE);
//var_dump($data);
$scores = $data['scores'];

// var_dump($scores);

$dom = new DOMDocument('1.0', 'ISO-8859-1');
$dom->preserveWhiteSpace = false;
$dom->formatOutput = true;

$xsl = new DOMDocument;
$xsl->load("scores.xsl");

$xsl_proc = new XSLTProcessor();
$xsl_proc->importStyleSheet($xsl);

$xslt = $dom->createProcessingInstruction('xml-stylesheet', 'type="text/xsl" href="scores.xsl"');
$dom->appendChild($xslt);

$score_list = $dom->createElement('scores', '');
$dom->appendChild($score_list);
foreach ($scores as $key => $value) {
	$record = $dom->createElement('record', '');
	$name = $dom->createElement('name', $value['player_name']);
	$score = $dom->createElement('score', $value['score']);
	$apple = $dom->createElement('apple', $value['apple']);
	$blueberry = $dom->createElement('blueberry', $value['blueberry']);

	$record->appendChild($name);
	$record->appendChild($score);
	$record->appendChild($apple);
	$record->appendChild($blueberry);
	$score_list->appendChild($record);
}

echo $xsl_proc->transformToXML($dom);

?>