//Globals
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	FOV = 45,
	NEAR = 0.1,
	FAR = 10000,
	GRIDSIZE = 15,
	UNITSIZE = 300,
	WALLHEIGHT = UNITSIZE / 3,
	WIREFRAMES = false;

var started = false;
var freeze = false;
var done = false;

var gummywormPrefs = {
	inverted: true,
	poison: "mario",
	name: "your-name-here",
	left: "a",
	right: "d",
	up: "w",
	down: "s"
}

var topSpeed = {
	"name" : "",
	"speed" : ""
}

var topLength = {
	"name" : "",
	"length" : ""
}

var MAXAPPLESCORE = -1;
var MAXBLUEBERRYSCORE = -1;

var MOVESPEED = 300,
	STARTLENGTH = 50;//600/5,
	LOOKSPEED = Math.PI/180;

var NUMSPEEDAPPLES = 2,
	NUMLENGTHAPPLES = 2,
	APPLE = -10,
	GAPPLE = -11,
	AIR = 0;

	var keyboard = new THREEx.KeyboardState();

var SPEEDCOLOR = '#FF4444',
	LENGTHCOLOR = '#4444FF';

var fullScreen;

var scene, camera, renderer, clock;
var speed_gauge, length_gauge, scoreFade;
var fruitEaten = applesEaten = blueberriesEaten = 0;
var SCORE = 0, SCORE_MULTIPLIER = 100;
var SCORE_UPDATE_TIME = 10, SCORE_DEGRADE_TIME = 100;
var scoreEaterId;
var runAnim = true;
var mouse = { x: 0, y: 0 };
var ATR = Math.PI/180; //angle to radians conversion factor

//grid of the world
var map = new Array(GRIDSIZE);
for (var i = 0; i < GRIDSIZE; i++) {
	map[i] = new Array(GRIDSIZE);
	for (var j = 0; j < GRIDSIZE; j++) {
		map[i][j] = new Array(GRIDSIZE);
		for (var k = 0; k < GRIDSIZE; k++) {
			map[i][j][k] = 0;
		}
	}
}
var mapWidth = map.length;
var mapHeight = map[0].length;
var mapDepth = map[0][0].length;

//apples
var apples, appleMeshes;

//snake
var snake;

//list for all collidable meshes
var collidableMeshList = [];

function scored(apple) {
	if (apple.flag == APPLE) {
		playSound(randomFrom(speedSounds[gummywormPrefs.poison]));
		applesEaten++;

		SCORE_MULTIPLIER += 100;

		$("#multiplier").text("x"+(applesEaten+1));
		$("#multiplier").fadeIn();
		setTimeout(function() {$("#multiplier").fadeOut();}, 1000);
	}
	else if (apple.flag = GAPPLE) {
		playSound(randomFrom(lengthSounds[gummywormPrefs.poison]));
		blueberriesEaten++;

		SCORE += SCORE_MULTIPLIER;
	}

	fruitEaten++;
	snake.eat(apple);

	var scoreText = -1;
	var displayLength = 3000;

	if (speed_gauge) {
		if (applesEaten == topSpeed.score + 1) {
			$('#speed_gauge').animate({ left: "-300px"}, 700);
			scoreText = "You beat "+topSpeed.name+" for the fastest snake!";
			displayLength = 5000;
		}
		else {
			speed_gauge.set(snake.speed);
		}
	}

	if (length_gauge) {
		if (blueberriesEaten == topLength.score + 1) {
			$('#length_gauge').animate({ left: "-300px"}, 700);
			scoreText = "You beat "+topLength.length+" for the longest snake!";
		} else {
			length_gauge.set(snake.length);
			displayLength = 5000;
		}
	}

	if (scoreText == -1) {
		scoreText = fruitEaten;
	}

	$('#score').text(scoreText);
	// $('#score').fadeIn();
	// scoreFade = setTimeout(function() {
	// 	$('#score').fadeOut();
	// }, displayLength);

	apple.randomize(map, GRIDSIZE);

	return true;
}

//everything's ready
function startUp() {
	console.log(window.location.host);
	init();
	animate();
}

function handleKeys(e) {
	if (done)
		return;
	// console.log(e.which);
	switch(e.which) {

		case 13:
			var win = window.open('http://cis.gvsu.edu/~gomerc/snake/scores.php', '_blank');
			win.focus();
			break;

		case 126:
		case 96: // toggle sounds
			var i = 0;
			for ( ; i < poisons.length; i++) {
				if (poisons[i] == gummywormPrefs.poison) {
					gummywormPrefs.poison = poisons[(i+1)%poisons.length];
					savePrefs();
					nextSong();
					break;
				}
			}
			$('#score').text('now playing '+gummywormPrefs.poison + ' style');
			$('#score').fadeIn();
			setTimeout(function() {
				$('#score').fadeOut();
			}, 4000);

			break;

		case 104:
		case 72: // H for help
			// $('#hint').fadeToggle();
			// $('#hintprompt').fadeOut();
			window.location.href = '/gummyworm/snake/myworm.html';
			// var win = window.open('snake/myworm.html', '_blank');
			// win.focus();
			break;
		
		case 105: // I for inverseLook toggle
		case 73:
			if (gummywormPrefs.inverted)
				gummywormPrefs.inverted = false;
			else
				gummywormPrefs.inverted = true;
			// gummywormPrefs.inverted = !gummywormPrefs.inverted;
			savePrefs();
			break;

		case 32: // SPACE to skip songs
			nextSong();
			break;
	}
}

var currentSong = 0;
function nextSong() {
	if (gummywormPrefs.poison == "mute") {
		music.pause();
		return;
	}

	currentSong = (currentSong + 1) % inGameMusic[gummywormPrefs.poison].length;
	music.pause();
	music.src = inGameMusic[gummywormPrefs.poison][currentSong];
	music.load();
	music.play();
	music.addEventListener("ended", function() {
	 	nextSong();
	});
}

// Handle window resizing
$(window).resize(function() {
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	ASPECT = WIDTH / HEIGHT;
	if (camera) {
		camera.aspect = ASPECT;
		camera.updateProjectionMatrix();
	}
	if (renderer) {
		renderer.setSize(WIDTH, HEIGHT);
	}
});

//stop moving around when the window is unfocused
// $(window).blur(function() {
// 	if (started) {
// 		freeze = true;
// 		$('#nocheat').fadeIn();
// 		stopScoreEating(scoreEaterId);
// 	}
// });
// //begin moving when windows regains focus
// $(window).focus(function() {
// 	if (started) {
// 		freeze = false;
// 		$('#nocheat').fadeOut();
// 		if (clock) clock.getDelta();
// 		startScoreEating();
// 	}
// });

//animate
function animate() {
	requestAnimationFrame(animate);
	if (!freeze) {
		render();
		update();
	}
}

function scoreEater() {
	if (SCORE > 0)
		SCORE--;
}

function startScoreEating() {
	if (scoreEaterId == null)
		scoreEaterId = setInterval(scoreEater, SCORE_DEGRADE_TIME);
}
function stopScoreEating() {
	clearInterval(scoreEaterId);
	scoreEaterId = null;
}

function scoreUpdater() {
	// $('#BIGSCORE').text(SCORE);
}

//Initialize everything
function init() {

	SCORE = 1000;
	//setup score stuffs
	setInterval(scoreUpdater, SCORE_UPDATE_TIME);

	if ($.localStorage('prefs') == null) {
		savePrefs();
	}
	gummywormPrefs = $.localStorage('prefs');

	var name = $.localStorage('prefs').name;
	if (name && name != "your name here") {
		$.get("http://cis.gvsu.edu/~gomerc/snake/myworm.php?name="+name, function (responseText) {
			console.log(responseText);
			var data = JSON.parse(responseText).prefs;
			gummywormPrefs.name = data.name;
			gummywormPrefs.style = data.style;
			gummywormPrefs.inverted = data.inverted;
			gummywormPrefs.up = data.upC;
			gummywormPrefs.down = data.downC;
			gummywormPrefs.left = data.leftC;
			gummywormPrefs.right = data.rightC;
			savePrefs();
			// console.log(data);
			// $("#name").val(data.name);
			// $("#style").val(data.style);
			// $("#invert").val(data.inverted);
			// $("#up").val(data.upC);
			// $("#left").val(data.leftC);
			// $("#down").val(data.downC);
			// $("#right").val(data.rightC);
		});
	}

	//start the start screen music
	music = document.createElement("audio");
	music.src = randomFrom(startScreenMusic[gummywormPrefs.poison]);
	music.play();
	
	//register key handlers
	// $('body').keypress(handleKeys);

	scene = new THREE.Scene();
	clock = new THREE.Clock();

	camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,120,500);

	//set up the web renderer 
	if ( Detector.webgl ) {
		renderer = new THREE.WebGLRenderer( {antialias:true} );	
	} else {
		renderer = new THREE.CanvasRenderer();
	}
	renderer.setSize(WIDTH,HEIGHT);
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);

	// fullScreen = THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	// document.body.appendChild( stats.domElement );

	//make the worm
	snake = new Snake("Snake");
	snake.inverseLook = gummywormPrefs.inverted;

	snake.head.add(camera);

	//init apples
	apples = [];
	appleMeshes = [];
	for (var i = 0; i < NUMSPEEDAPPLES; i++) {
		var newApple = new Apple(APPLE, SPEEDCOLOR);
		scene.add(newApple.sphere);
		newApple.randomize();
		apples.push(newApple);
		appleMeshes.push(newApple.sphere);
	}
	for (var i = 0; i < NUMLENGTHAPPLES; i++) {
		var newApple = new Apple(GAPPLE, LENGTHCOLOR);
		scene.add(newApple.sphere);
		newApple.randomize();
		apples.push(newApple);
		appleMeshes.push(newApple.sphere);
	}

	//put all the objects in the world
	createWorld();

	//create a skybox full of clouds, grass ground
	createSkybox();

	//add score, coord, and start button hud
	// $('body').append('<div id="BIGSCORE" class="BIGSCORE"></div>');
	$('body').append('<div id="multiplier" class="multiplier"></div>');
	$('body').append('<div id="score" class="score">Gummy Worm</div>');
	$('body').append('<div id="start_button" class="start_button">Type or Click Anywhere to Start</div>');
	// $('body').append('<div id="hintprompt" class="hintprompt"><h1>Press "H" to show help</h1></div>');
	// $('body').append('<div id="hint" class="hint"><h1>Instructions</h1><h2>Press "H" to edit preferences</h2><h3>Controls</h3><p> - WASD to control the gummy worm</p><p> - I to toggle inverted controls</p><p> - SPACE to skip song</p><h3>Goal: Have the highest score!</h3><p> - Apples and Blueberries increase your score</p><p> - Apples also increase speed</p><p> - Blueberries also increase length</p><p> - You will die if you run into anything, including yourself</p></div>');
	$('body').append('<div id="nocheat" class="nocheat"><div id="paused" class="paused">Paused</div></div>');
	var highScores = 
	'<div id="scores" class="scores"><h1>MULTIPLAYER</h1>' +
        '<script>'+
            //get top 5
			'$.get("http://cis.gvsu.edu/~gomerc/snake/high_score.php", function (responseText) {' +
				'var data = JSON.parse(responseText);' +
				'$("#scores").append("<h2>Top Players</h2>");' +
				'for (var i = 0; i < data.scores.length; i++) { ' +
					'$("#scores").append("<h3>#"+(i+1)+" "+data.scores[i].player_name+"<small> - "+data.scores[i].score+" points ("+data.scores[i].apple+" apples, "+data.scores[i].blueberry+" blueberries)</small></h3>");' +
				'}' +
				//get most apples
				'$.get("http://cis.gvsu.edu/~gomerc/snake/high_score.php?maxa=true", function (responseText) {' +
					'var data = JSON.parse(responseText);' +
					'console.log("maxa",data);' +
					'$("#scores").append("<h2>Record for Most Apples is "+data.max+"<small> - by "+data.name+"</small></h2>");' +
					//get most blueberries
					'$.get("http://cis.gvsu.edu/~gomerc/snake/high_score.php?maxb=true", function (responseText) {' +
						'var data = JSON.parse(responseText);' +
						'console.log("maxb",data);'+
						'$("#scores").append("<h2>Record for Most Blueberries is "+data.max+"<small> - by "+data.name+"</small></h2>");' +
					'});' +
				'});' +
			'});' +
		'</script>' +
    '</div>';
	$('body').append(highScores);

	//start!
	$('body').one('click', function(e) {
		playSnake(e);
	});

	$('body').one('keypress', function(e) {
		playSnake(e);
	});
}

//get everything going
function playSnake(e){
	if (e.which == 72 || e.which == 104){
		e.preventDefault();
		$('body').one('keypress', function(e) {
			playSnake(e);
		});
		return;
	}
	if (started || done)
		return;
	started = true;
	e.preventDefault();

	//start degrading score
	// startScoreEating();
	// $("#BIGSCORE").fadeIn(1000);

	//setup speed gauge
	var opts = {
	  lines: 12, // The number of lines to draw
	  angle: 0.15, // The length of each line
	  lineWidth: 0.44, // The line thickness
	  pointer: {
	    length: 0.9, // The radius of the inner circle
	    strokeWidth: 0.035, // The rotation offset
	    color: '#000000' // Fill color
	  },
	  colorStart: SPEEDCOLOR,   // Colors
	  colorStop: SPEEDCOLOR,    // just experiment with them
	  strokeColor: '#FFFFFF',   // to see which ones work best for you
	  generateGradient: true
	};
	$('body').append('<canvas id="speed_gauge" class="speed_gauge"></canvas>');
	var target = $('#speed_gauge')[0]; // your canvas element
	// console.log(target);
	speed_gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
	// console.log(speed_gauge);
	speed_gauge.animationSpeed = 32; // set animation speed (32 is default value)
	speed_gauge.minValue = MOVESPEED - 1; // so it looks like you're moving
	speed_gauge.set(MOVESPEED); // set actual value
	speed_gauge.maxValue = Math.floor(MOVESPEED*10);
	$.get('http://cis.gvsu.edu/~gomerc/snake/high_score.php?maxa=true', function (responseData) {
		var data = JSON.parse(responseData);
		// console.log(data);
		topSpeed.name = data.name;
		topSpeed.score = data.max;
		speed_gauge.maxValue = Math.floor(snake.speedIncrement*data.max); // set max gauge value by highest score
		if (speed_gauge) speed_gauge.set(MOVESPEED);
		setTimeout(function() {
			$('#speed_gauge').animate( { left: "20px" }, 700);
		}, 5000);
	});

	//setup length gauge
	var opts = {
	  lines: 12, // The number of lines to draw
	  angle: 0.35, // The length of each line
	  lineWidth: 0.1, // The line thickness
	  colorStart: LENGTHCOLOR,   // Colors
	  colorStop: LENGTHCOLOR,    // just experiment with them
	  strokeColor: '#EEEEEE',  // to see which ones work best for you
	  generateGradient: true
	};
	$('body').append('<canvas id="length_gauge" class="length_gauge"></canvas>');
	var target_len = $('#length_gauge')[0];
	length_gauge = new Donut(target_len).setOptions(opts);
	length_gauge.minValue = STARTLENGTH;
	length_gauge.maxValue = Math.floor(STARTLENGTH*10);
	length_gauge.animationSpeed = 32;
	length_gauge.set(STARTLENGTH);
	$.get('http://cis.gvsu.edu/~gomerc/snake/high_score.php?maxb=true', function(responseData) {
		var data = JSON.parse(responseData);
		topLength.name = data.name;
		topLength.score = data.max;
		length_gauge.maxValue = Math.floor(snake.growIncrement*data.max);
		setTimeout(function() {
			$('#length_gauge').animate( { right: "20px" }, 700);
		}, 5000);
	});

	$('#start_button').fadeOut();
	$('#score').fadeOut();
	$('#scores').fadeOut();
	$('#hint').fadeOut();
	$('#hintprompt').fadeOut();

	music.pause();
	music.src = randomInGameSong();

	var startSound = document.createElement("audio");
	startSound.src = randomFrom(startSounds[gummywormPrefs.poison]);
	startSound.play();
 	music.play();
}

//creates all the objects in the world
function createWorld() {
	var units = mapWidth;

	//floor
	var floorTexture = new THREE.ImageUtils.loadTexture('/gummyworm/snake/textures/wood-floor.jpg');
	floorTexture.side = THREE.DoubleSide;
	var floor = new THREE.Mesh(
		new THREE.CubeGeometry((units+2)*UNITSIZE, UNITSIZE, (units+2)*UNITSIZE),
		new THREE.MeshLambertMaterial(/*{color: 0xEDCBA0}, */{map: floorTexture }/*, side: THREE.DoubleSide}*/)
	);
	floor.position.y = -UNITSIZE;
	scene.add(floor);
	collidableMeshList.push(floor);

	//slighly visible boundary walls and ceiling
	var pillarTexture = new THREE.ImageUtils.loadTexture('/gummyworm/snake/textures/wood-wall.jpg');
	pillarTexture.wrapS = pillarTexture.wrapT = THREE.RepeatWrapping;
	pillarTexture.repeat.set(0.5,8);
	var boundaryWallGeometry = new THREE.CubeGeometry(UNITSIZE,units*UNITSIZE,UNITSIZE);	
	var boundaryMaterial = new THREE.MeshLambertMaterial(/*{color: 0x1234FF, opacity: 0.5, transparent: true,*/{ map: pillarTexture, side: THREE.DoubleSide});

	var ceilingTexture = new THREE.ImageUtils.loadTexture('/gummyworm/snake/textures/wood-wall.jpg');
	ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
	ceilingTexture.repeat.set(4,2);
	var ceilingGeometry = new THREE.CubeGeometry((units+2)*UNITSIZE,UNITSIZE,(units+2)*UNITSIZE);
	var ceilingMaterial = new THREE.MeshLambertMaterial(/*{color: 0x1234FF, opacity: 0.5, transparent: true,*/{ map: ceilingTexture, side: THREE.DoubleSide});
	var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
	ceiling.position.y = GRIDSIZE*UNITSIZE + 1;
	scene.add(ceiling);
	collidableMeshList.push(ceiling);

	//light 1
	var directionalLight1 = new THREE.DirectionalLight( 0xF7EFBE, 0.7);
	directionalLight1.position.set( 0.5, 1, 0.5);
	scene.add(directionalLight1);

	//light 2
	var directionalLight2 = new THREE.DirectionalLight( 0xF7EFBE, 0.5);
	directionalLight2.position.set( -0.5, 1, -0.5);
	scene.add(directionalLight2);

	var wallTexture = new THREE.ImageUtils.loadTexture('/gummyworm/snake/textures/wood-wall.jpg');
	wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
	wallTexture.repeat.set(8,0.5);
	var wallGeometry = new THREE.CubeGeometry(UNITSIZE,UNITSIZE,GRIDSIZE*UNITSIZE);
	var wallMaterial = new THREE.MeshLambertMaterial({/*color: 0x97694F,*/ map: wallTexture, transparent: true, opacity: 0.2});
	var wall = {};

	wall['left-boundary'] = new THREE.Mesh(boundaryWallGeometry, boundaryMaterial);
	wall['left-boundary'].position.x = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['left-boundary'].position.y = GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['left-boundary'].position.z = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;

	wall['right-boundary'] = new THREE.Mesh(boundaryWallGeometry, boundaryMaterial);
	wall['right-boundary'].position.x = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;
	wall['right-boundary'].position.y = GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['right-boundary'].position.z = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;

	wall['top-boundary'] = new THREE.Mesh(boundaryWallGeometry, boundaryMaterial);
	wall['top-boundary'].position.x = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['top-boundary'].position.y = GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['top-boundary'].position.z = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;

	wall['bottom-boundary'] = new THREE.Mesh(boundaryWallGeometry, boundaryMaterial);
	wall['bottom-boundary'].position.x = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;
	wall['bottom-boundary'].position.y = GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['bottom-boundary'].position.z = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;

	//add all the boundaries
	scene.add(wall['left-boundary']);
	scene.add(wall['right-boundary']);
	scene.add(wall['top-boundary']);
	scene.add(wall['bottom-boundary']);

	//add all walls and boundaries to collidable mesh list
	collidableMeshList.push(wall['left-boundary']);
	collidableMeshList.push(wall['right-boundary']);
	collidableMeshList.push(wall['top-boundary']);
	collidableMeshList.push(wall['bottom-boundary']);

	if (WIREFRAMES) {
		var wireframeCubeGeometry = new THREE.CubeGeometry(UNITSIZE,UNITSIZE,UNITSIZE);
		var wireframeCubeMaterial = new THREE.MeshLambertMaterial({color: 0x1234FF, opacity: 0.5, transparent: true, wireframe:true});

		 for (var i = 0; i < GRIDSIZE; i++)
		 	for (var j = 0; j < GRIDSIZE; j++)
		 		for (var k = 0; k < GRIDSIZE; k++) {
		 			var newBlock = new THREE.Mesh(wireframeCubeGeometry, wireframeCubeMaterial);
		 			newBlock.position.x = (i-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2;
		 			newBlock.position.y = j*UNITSIZE;
		 			newBlock.position.z = (k-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2;
		 			scene.add(newBlock);
		 		}
 	}

	// create a point light
	var pointLight = new THREE.PointLight(0xFFFFFF);

	// set its position
	pointLight.position.x = 10;
	pointLight.position.y = 0;
	pointLight.position.z = 50;

	// add to the scene
	scene.add(pointLight);
}

var skyboxes = [
	"snow",
	"underwater",
	"lake1"
];

//make the skybox
function createSkybox() {
	var box = randomFrom(skyboxes);
	var materialArray = [];
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/gummyworm/snake/textures/'+box+'/right.jpg' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/gummyworm/snake/textures/'+box+'/left.jpg' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/gummyworm/snake/textures/'+box+'/top.jpg' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/gummyworm/snake/textures/grass.png' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/gummyworm/snake/textures/'+box+'/front.jpg' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/gummyworm/snake/textures/'+box+'/back.jpg' ) }));
	for (var i = 0; i < 6; i++)
	   materialArray[i].side = THREE.BackSide;
	var skyboxMaterial = new THREE.MeshFaceMaterial( materialArray );
	
	var skyboxSize = 10000;
	var skyboxGeom = new THREE.CubeGeometry( skyboxSize, skyboxSize, skyboxSize, 1, 1, 1 );
	
	var skybox = new THREE.Mesh( skyboxGeom, skyboxMaterial );
	scene.add( skybox );
	collidableMeshList.push(skybox);
}

function moveSnake(delta){

	var moveDistance = snake.speed * delta;
	var rotateAngle = Math.PI / 2 * delta;

	var up = (((keyboard.pressed(gummywormPrefs.down) || keyboard.pressed("down")) && gummywormPrefs.inverted) || (keyboard.pressed(gummywormPrefs.up) || keyboard.pressed("up")) && !gummywormPrefs.inverted);
	var down = (((keyboard.pressed(gummywormPrefs.up) || keyboard.pressed("up")) && gummywormPrefs.inverted) || (keyboard.pressed(gummywormPrefs.down) || keyboard.pressed("down")) && !gummywormPrefs.inverted);
	var left = keyboard.pressed(gummywormPrefs.left) || keyboard.pressed("left");
	var right = keyboard.pressed(gummywormPrefs.right) || keyboard.pressed("right");
	var rotLeft = keyboard.pressed("Q");
	var rotRight = keyboard.pressed("E");

	// if (keyboard.pressed("shift")) {
	// 	moveDistance*=4;
	// }

	if (left) {
		var rotation_matrix = new THREE.Matrix4().makeRotationY(2*ATR);
		snake.sMatrix.multiply(rotation_matrix);
		snake.head.rotation.setEulerFromRotationMatrix(snake.sMatrix);
	}
	if (right) {
		var rotation_matrix = new THREE.Matrix4().makeRotationY(-2*ATR);
		snake.sMatrix.multiply(rotation_matrix);
		snake.head.rotation.setEulerFromRotationMatrix(snake.sMatrix);
	}
	if (up) {
		var rotation_matrix = new THREE.Matrix4().makeRotationX(2*ATR);
		snake.sMatrix.multiply(rotation_matrix);
		snake.head.rotation.setEulerFromRotationMatrix(snake.sMatrix);
	}
	if (down) {
		var rotation_matrix = new THREE.Matrix4().makeRotationX(-2*ATR);
		snake.sMatrix.multiply(rotation_matrix);
		snake.head.rotation.setEulerFromRotationMatrix(snake.sMatrix);
	}
	if (rotLeft) {
		var rotation_matrix = new THREE.Matrix4().makeRotationZ(4*ATR);
		snake.sMatrix.multiply(rotation_matrix);
		snake.head.rotation.setEulerFromRotationMatrix(snake.sMatrix);
	}
	if (rotRight) {
		var rotation_matrix = new THREE.Matrix4().makeRotationZ(-4*ATR);
		snake.sMatrix.multiply(rotation_matrix);
		snake.head.rotation.setEulerFromRotationMatrix(snake.sMatrix);
	}

	snake.head.translateZ( -moveDistance );
}

//render the scene
function update() {
	if (!started)
		return;

	//update the camera
	var delta = clock.getDelta();

	//update the movements
	moveSnake(delta);

	//update the snake's tail
	// console.log(snake);
	snake.tail();

	updateOpponents();

	var cameraVector = coordToGrid(camera.position);

	//check for collisions with apples
	var snakeOrigin = snake.head.position.clone();
	var collisionFound = false;
	for (apple in apples) {
		apple = apples[apple];
		for (var vertexIndex = 0; vertexIndex < snake.head.geometry.vertices.length && !collisionFound; vertexIndex++) {
			var localVertex = snake.head.geometry.vertices[vertexIndex].clone();
			var globalVertex = localVertex.applyMatrix4(snake.head.matrix);
			var directionVector = globalVertex.sub(snake.head.position);

			var ray = new THREE.Raycaster(snakeOrigin, directionVector.clone().normalize());
			var allCollidables = [apple.sphere];
			var collisionResults = ray.intersectObjects(allCollidables);
			if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length())
				collisionFound = scored(apple)
		}
	}



	var snakeOrigin = snake.head.position.clone();
	var hitBoundaries = false;
	for (var vertexIndex = 0; vertexIndex < snake.head.geometry.vertices.length && !collisionFound; vertexIndex++) {
		var localVertex = snake.head.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4(snake.head.matrix);
		var directionVector = globalVertex.sub(snake.head.position);

		var ray = new THREE.Raycaster(snakeOrigin, directionVector.clone().normalize());

		var allCollidables = collidableMeshList;//.concat(snake.traces.slice(50));

		var collisionResults = ray.intersectObjects(allCollidables);
		if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length())
			hitBoundaries = true;
	}

	var hitSelf = false;
	for (var i = 12; i < snake.traces.length; i += 1) {
		var thisTrace = snake.traces[i];
		var xDiff = thisTrace.position.x-snake.head.position.x;
		var yDiff = thisTrace.position.y-snake.head.position.y;
		var zDiff = thisTrace.position.z-snake.head.position.z;

		var dist = Math.sqrt(Math.pow(xDiff,2)+Math.pow(yDiff,2)+Math.pow(zDiff,2));
		if (dist < snake.radius*2)
			hitSelf = true;
	}

	var hitOpponent = false;
	for (var i = 0; i < opponents.length; i++) {
		for (var j = 0; j < opponents[i].snake.traces.length; j++) {
			var thisTrace = opponents[i].snake.traces[j];
			var xDiff = thisTrace.position.x-snake.head.position.x;
			var yDiff = thisTrace.position.y-snake.head.position.y;
			var zDiff = thisTrace.position.z-snake.head.position.z;

			var dist = Math.sqrt(Math.pow(xDiff,2)+Math.pow(yDiff,2)+Math.pow(zDiff,2));
			if (dist < snake.radius*2)
				hitOpponent = true;
		}
	}

	if (hitBoundaries || hitSelf || hitOpponent) {
		started = false;
		done = true;
		clearInterval(locationUpdater);
		clearTimeout(scoreFade);
		if (hitBoundaries)
			$('#start_button').text("Sorry, you've just died... Press ENTER to restart.");
		else if (hitSelf)
			$('#start_button').text("Ouch, you hit yourself... Press ENTER to restart.");
		else if (hitOpponent)
			$('#start_button').text("Yikes, they got you good... Press ENTER to restart.");
		// snake.destroy(function() {
			snake.destroy();
			socket.emit('destroyed', { id : id });
		// });
		$('#start_button').fadeIn();
		$('#score').text("You ate "+fruitEaten+" fruit");
		$('#score').fadeIn();

		var player_name = gummywormPrefs.name;

		// $('body').append('<form name="scores" id="score_form" action="http://cis.gvsu.edu/~gomerc/snake/high_score.php" method="post"><input class="player_name" id="player_name" name="player_name" value="'+player_name+'" type="text"><input type="hidden" name="player_score" value="'+fruitEaten+'"><input type="hidden" name="apple" value="'+applesEaten+'"><input type="hidden" name="blueberry" value="'+blueberriesEaten+'"></form>');

		$('#score_form').submit(function() {
			gummywormPrefs.name = $('#player_name').val();
			savePrefs();
		});

		music.pause();
		playSound(randomFrom(endSounds[gummywormPrefs.poison]));

		document.addEventListener("keydown", function (e) {
			if (e.which == 13) {
				// $('#score_form').submit();
				// playSound('snake/effects/mario-thankyou.wav', function() {
					window.location.reload();
				// });
			}
		});
	}

	stats.update();
}

var opponentGeometry = new THREE.SphereGeometry(UNITSIZE/10,16,16);
var opponentMaterial = new THREE.MeshLambertMaterial({color: 0x00FF00});

function updateOpponents() {
	// console.log(opponents.length);
	for (var i = 0; i < opponents.length; i++) {
		var opponent = opponents[i];
		if (opponent.snake == null) {
			opponent.snake = new Snake("Snake", opponent.location, opponent.color);
			console.log('added-mesh-***');
		}
		opponent.snake.head.position.x = opponent.location.x;
		opponent.snake.head.position.y = opponent.location.y;
		opponent.snake.head.position.z = opponent.location.z;
		opponent.snake.tail();
	}
}

function render() {
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	renderer.clear();
	renderer.render(scene, camera);
}

//translates coordinates from a point/vector in space onto the snake game grid
function coordToGrid(v) {
	return new THREE.Vector3(Math.round((v.x - UNITSIZE/2)/UNITSIZE+GRIDSIZE/2),Math.round(v.y/UNITSIZE),Math.round((v.z - UNITSIZE/2)/UNITSIZE+GRIDSIZE/2));
}

//translates coordinates on the snake game grid to their real space position
function gridToCoord(v) {
	return new THREE.Vector3(Math.round((v.x-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2),Math.round(v.y*UNITSIZE),Math.round((v.z-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2));
}

//save off prefs
function savePrefs() {
	$.localStorage('prefs', gummywormPrefs);
}

//sounsd and effects!!
var music;

var musicNames = [
	"snake/music/cantina.mp3",
	"snake/music/doctorwho.mp3",
	"snake/music/evolution-paint.mp3",
	"snake/music/fireandflames-paint.mp3",
	"snake/music/fzero1.mp3",
	"snake/music/fzero2.mp3",
	"snake/music/fzerotheme.mp3",
	"snake/music/gangnam.mp3",
	"snake/music/gangnam-paint.mp3",
	"snake/music/geometry.mp3",
	"snake/music/lostwoods-remix.mp3",
	"snake/music/mariokart.wav",
	"snake/music/music.mp3",
	"snake/music/music1.mp3",
	"snake/music/music2.mp3",
	"snake/music/music3.mp3",
	"snake/music/music4.mp3",
	"snake/music/nyan-gameboy.mp3",
	"snake/music/RAM.mp3",
	"snake/music/stillalive.mp3",
	"snake/music/valley.mp3",
	"snake/music/valley-remix.mp3",
	"snake/music/violin.mp3"
];

// as in "choose your poison"
var poisons = [
        "mario",
        "zelda",
        "steve",
        "mute"
];

var startScreenMusic = {
	
	"mario" : [
		"snake/music/mario-bros-theme-acapella.mp3",
		"snake/music/mario-bros-theme-acapella-2.mp3"
	],

	"zelda" : [
		"snake/music/zelda-theme.mp3",
		"snake/music/zelda-theme-8bit.mp3",
		"snake/music/zelda-valley.mp3",
		"snake/music/zelda-theme-remix-violin.mp3"
	],

	"steve" : [
		"snake/music/RAM.mp3"
	]
}

var inGameMusic = {

	"mario" : [
		"snake/music/mario-bros-theme.mp3",
		"snake/music/mario-bros-underworld-theme.mp3",
		"snake/music/mario-bros-overworld-theme.mp3",
			"snake/music/mario-bros-theme-acapella.mp3",
		"snake/music/mario-bros-theme-acapella-2.mp3"
	],

	"zelda" : [
		"snake/music/zelda-valley-remix.mp3",
		"snake/music/zelda-theme-remix.mp3",
		"snake/music/zelda-storms-remix.mp3",
			"snake/music/zelda-theme.mp3",
		"snake/music/zelda-theme-8bit.mp3",
		"snake/music/zelda-valley.mp3",
		"snake/music/zelda-theme-remix-violin.mp3"
	],

	"steve" : [
		"snake/music/RAM.mp3"
	]
}

var startSounds = {

	"mario" : [
		"snake/effects/mario-start1.wav",
		"snake/effects/mario-start2.wav",
		"snake/effects/mario-start3.wav",
		"snake/effects/mario-start4.wav",
		"snake/effects/mario-start5.wav"
	],

	"zelda" : [
		"snake/effects/navi-hello1.wav",
		"snake/effects/navi-hello2.wav",
		"snake/effects/navi-hello3.wav",
		"snake/effects/navi-hello4.wav",
		"snake/effects/navi-hello5.wav"
	]
}

var endSounds = {

	"mario" : [
		"snake/effects/mario-end0.wav",
		"snake/effects/mario-end1.wav",
		"snake/effects/mario-end2.wav",
		"snake/effects/mario-end3.wav",
		"snake/effects/mario-end4.wav"
	],

	"zelda" : [
		"snake/effects/navi-watchout1.wav",
		"snake/effects/navi-watchout2.wav",
		"snake/effects/navi-watchout3.wav",
		"snake/effects/navi-watchout4.wav",
		"snake/effects/navi-watchout5.wav"
	]
}

var speedSounds = {
	
	"mario" : [
		"snake/effects/mario-speed.wav"
	],

	"zelda" : [
		"snake/effects/zelda-speed.wav"
	]
}

var lengthSounds = {

	"mario" : [
		"snake/effects/mario-length.wav"
	],

	"zelda" : [
		"snake/effects/zelda-length.wav"
	]
}

function randomInGameSong() {
	if (gummywormPrefs.poison == "mute")
		return;

	currentSong = Math.floor(Math.random() * inGameMusic[gummywormPrefs.poison].length);
	return inGameMusic[gummywormPrefs.poison][currentSong];
}

function randomFrom(collection) {
	if (collection)
		return collection[Math.floor(Math.random() * collection.length)];
	else
		return "";
}

function playSound(fileName, callback) {
	var sound = document.createElement("audio");
	sound.src = fileName;
	sound.play();
	sound.addEventListener("ended", function() {
	 	if (callback) {
	 		callback();
	 	}
	});
}


// multiplayer shenanigans

var opponents = [];
var opponentIds = {};
var socket = io.connect(window.location.hostname);
var id = null;
var peeps = {};
var numPeeps = 0;
var locationUpdater;
socket.on('send-location', function(data) {
	id = data.id;
	console.log('connected');

	var me = {};
	me.id = data.id;
	me.color = snake.color;

	console.log('sending location');
	locationUpdater = setInterval(function() {
		if (snake && snake.head && !done) {
			me.location = snake.head.position;
			socket.emit('location', me);
		}
		// } else if (done) {
		// 	socket.emit('destroyed', me);
		// }
	}, 100);
});
socket.on('location-update', function(data) {
	if (!opponentIds[data.id]) {
		opponentIds[data.id] = opponents.length;
		opponents.push({ id: data.id, location: data.location, snake: null, color: data.color});
	} else {
		opponents[opponentIds[data.id]].id = data.id;
		opponents[opponentIds[data.id]].location = data.location;
	}
});
socket.on('destroyed', function(data) {
	opponents[opponentIds[data.id]].snake.destroy();
	alert("destroeyd!");
});