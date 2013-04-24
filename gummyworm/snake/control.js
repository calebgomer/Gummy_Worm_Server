function update() {
	// move forwards/backwards/left/right
	if ( keyboard.pressed("W") )
		MovingCube.translateZ( -moveDistance );
	if ( keyboard.pressed("S") )
		MovingCube.translateZ(  moveDistance );
	if ( keyboard.pressed("Q") )
		MovingCube.translateX( -moveDistance );
	if ( keyboard.pressed("E") )
		MovingCube.translateX(  moveDistance );	

	// rotate left/right/up/down
	var rotation_matrix = new THREE.Matrix4().identity();
	if ( keyboard.pressed("A") )
		rotation_matrix = new THREE.Matrix4().makeRotationY(rotateAngle);
	if ( keyboard.pressed("D") )
		rotation_matrix = new THREE.Matrix4().makeRotationY(-rotateAngle);
	if ( keyboard.pressed("R") )
		rotation_matrix = new THREE.Matrix4().makeRotationX(rotateAngle);
	if ( keyboard.pressed("F") )
		rotation_matrix = new THREE.Matrix4().makeRotationX(-rotateAngle);
	if ( keyboard.pressed("A") || keyboard.pressed("D") || 
	     keyboard.pressed("R") || keyboard.pressed("F") )
	{
		MovingCube.matrix.multiply(rotation_matrix);
		MovingCube.rotation.setEulerFromRotationMatrix(MovingCube.matrix);
	}

	var relativeCameraOffset = new THREE.Vector3(0,50,200);

	var cameraOffset = relativeCameraOffset.applyMatrix4( MovingCube.matrixWorld );

	camera.position.x = cameraOffset.x;
	camera.position.y = cameraOffset.y;
	camera.position.z = cameraOffset.z;
	camera.lookAt( MovingCube.position );
}