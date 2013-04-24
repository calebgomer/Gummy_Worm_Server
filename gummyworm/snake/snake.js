var traceGeometry;
var traceMaterial;

var UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4, FORWARD = 5, BACKWARD = 6;

function Snake(name, headPos, color) {
	this.name = name;
	this.direction = FORWARD;
	this.newSectionLocation = null;
	this.length = STARTLENGTH;
	this.growIncrement = STARTLENGTH*.25;
	this.traces = [];
	this.speed = MOVESPEED;
	this.speedIncrement = MOVESPEED*.25;
	this.turnSpeed = LOOKSPEED;
	this.turnSpeedIncrement = LOOKSPEED*.25;
	this.radius = UNITSIZE/5;
	this.sMatrix = new THREE.Matrix4();
	traceGeometry = traceGeometry = new THREE.SphereGeometry(UNITSIZE/5,16,16);
	if (color)
		this.color = color;
	else
		this.color = '#'+Math.floor(Math.random()*16777215).toString(16);
	traceMaterial = new THREE.MeshLambertMaterial({color: this.color, opacity: 0.0, transparent: true});
	this.head = new THREE.Mesh(traceGeometry, traceMaterial);
	if (headPos) {
		this.head.position.x = headPos.x;
		this.head.position.y = headPos.y;
		this.head.position.z = headPos.z;
	} else {
		this.head.position.x = Math.floor(Math.random()*GRIDSIZE*UNITSIZE-2);
		this.head.position.y = Math.floor(Math.random()*GRIDSIZE*UNITSIZE-2);
		this.head.position.z = Math.floor(Math.random()*GRIDSIZE*UNITSIZE-2);
	}
	scene.add(this.head);
	this.inverseLook = true;
	traceMaterial = new THREE.MeshLambertMaterial({color: this.color, opacity: 1.0, transparent: false});
}

var xx = 0;
var xxx = 0;

var snakeColors = [
	"#00FFFF",
	"#FFFF00",
	"#00FF00",
	"#FF00B3"
];

Snake.prototype = {
	//just scored/ate the apple
	eat: function(theApple) {
		if (theApple.flag == APPLE) {
			this.speed += this.speedIncrement;
			this.turnSpeed += this.turnSpeedIncrement;
		}
		else if (theApple.flag == GAPPLE)
			this.length = Math.floor(this.length += this.growIncrement);
	},
	destroy: function(callback) {
		for (var i = 0; i < this.traces.length; i++) {
			scene.remove(this.traces[i]);
		}
		this.traces.clear();
		if (callback)
			callback();
	},
	tail: function() {

		var makeTrace = false;
		var thisTrace = this.traces[0];
		if (thisTrace) {
			var xDiff = thisTrace.position.x-this.head.position.x;
			var yDiff = thisTrace.position.y-this.head.position.y;
			var zDiff = thisTrace.position.z-this.head.position.z;

			var dist = Math.sqrt(Math.pow(xDiff,2)+Math.pow(yDiff,2)+Math.pow(zDiff,2));
			// console.log(dist,this.radius);
			if (dist >= this.radius * 1)
				makeTrace = true;
		} else {
			makeTrace = true;
		}


		xx++;
		if (xx % 50 == 0)
			xxx++;
		traceMaterial = new THREE.MeshLambertMaterial({color: this.color, opacity: 1.0, transparent: true});

		// console.log("head",this.head.position);
		var lastHeadPosition = this.head.position.clone();
		this.head.position;
		// Get direction from startVector to endVector
		var dirVector = new THREE.Vector3();
		dirVector.subVectors( lastHeadPosition, this.head.position );
		dirVector.normalize();

		if (makeTrace) {

			var newTrace = new THREE.Mesh(traceGeometry, traceMaterial);
			newTrace.position = this.head.position.clone();

			this.traces.splice(0,0,newTrace);
			scene.add(newTrace);

			if (this.traces[8]) {
				this.traces[8].material.opacity = 1.0;
			}

			if (this.traces[this.length-1]) {
				scene.remove(this.traces[this.length-1]);
				this.traces.splice(this.length-1,1);
			}
		}
	}
}
