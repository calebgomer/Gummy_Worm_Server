
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , io = require('socket.io')
  , path = require('path');

var app = express();

app.configure(function(){

  //use the nodejitsu port, or 3000 on local host
  app.set('port', process.env.PORT || 4000);

  //turn on developer logging
  app.use(express.logger('dev'));

  //gummyworm static directories
  app.use('/gummyworm',           express.static(__dirname + '/gummyworm'));
  app.use('/gummyworm/css',       express.static(__dirname + '/gummyworm/css'));
  app.use('/gummyworm/js',        express.static(__dirname + '/gummyworm/js'));
  app.use('/gummyworm/textures',  express.static(__dirname + '/gummyworm/textures'));

  //public files directory
  app.use(express.static(path.join(__dirname, 'public')));

  //middleware
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  //the router
  app.use(app.router);
});

//DEV?
app.configure('development', function(){
  app.use(express.errorHandler());
});

//basic routes
app.get('/gummyworm', function(req, res) {
  res.sendfile(__dirname + '/gummyworm/play.html');
});
app.get('*', function(req, res) {
  res.sendfile(__dirname + '/gummyworm/play.html')
});

//start it up
var server = http.createServer(app);
//express
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  setupGameBoard();
});
//socket.io
var io = io.listen(server);
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

var Directions = {
  posX: 1,
  negX: 2,
  posY: 3,
  negY: 4,
  posZ: 5,
  negZ: 6,
  length: 6
}

function Coordinate(x, y, z, direction) {
  this.x = x || Math.floor(Math.random()*10);
  this.y = y || Math.floor(Math.random()*10);
  this.z = z || Math.floor(Math.random()*10);
  this.direction = direction || Math.floor(Math.random()*Directions.length)+1;
}

var players = [];
var playerSpots = {};

function Player(socket, name, color, location) {
  this.socket = socket;
  this.name = name;
  this.color = color;
  this.location = location;
}

var _players = {
  1: { x: 000, y: 000, z: 000, up: '+y', dir: '+z' },
  2: { x: 100, y: 000, z: 000, up: '+y', dir: '+z' },
  3: { x: 100, y: 000, z: 000, up: '+x', dir: '+y' },
  4: { x: 000, y: 000, z: 000, up: '+y', dir: '+x' }
};

var gameTickId;

// function Position(x, y, z, up, isUpPos, dir, isDirPos, left, isLeftPos) {
//   x: x || 0,
//   y: y || 0,
//   z: z || 0,
//   up: up || 'y',
//   isUpPos: isUpPos || true,
//   dir: dir || 'z',
//   isDirPos: isDirPos || false,
//   left: left || 'x',
//   isLeftPos: isLeftPos || false
// }

function addPlayer(socket, data) {
  //calculate random location
  var location = {};
  location.y = 0;
  location.up = 'y';
  location.isUpPos = true;
  switch(players.length) {
    case 0:
      location.x = 0;
      location.z = 0;
      location.dir = 'z';
      location.isDirPos = false;
      location.left = 'x';
      location.isLeftPos = false;
      break;
    case 1:
      location.x = 0;
      location.z = 99;
      location.dir = 'x';
      location.isDirPos = true;
      location.left = 'z';
      location.isLeftPos = false;
      break;
    case 2:
      location.x = 99;
      location.z = 99;
      location.dir = 'z';
      location.isDirPos = true;
      location.left = 'x';
      location.isLeftPos = true;
      break;
    case 3:
      location.x = 99;
      location.z = 0;
      location.dir = 'x';
      location.isDirPos = false;
      location.left = 'z';
      location.isLeftPos = true;
      break;
  }
  
  console.log('new player');

  playerSpots[socket.id] = players.length;
  players.push(new Player(socket, data.name, data.color, location ));

  socket.emit('start-details', location);

  console.log('****LEN****',players.length);
  if (players.length >= 1)
    gameTickId = setInterval(loop, 750);
}

io.sockets.on('connection', function(socket) {
  //welcome new player, give them their ID
  socket.emit('send-details', { });
  // socket.emit('send-location', { id : socket.id });

  //get player details
  socket.on('player-details', function(data) { addPlayer(socket, data); });

  //player requests move
  socket.on('request-move', function(data) { handleMoves(socket, data); });

  //broadcast the player's location
  // socket.on('location', function(data) {
  //   socket.volatile.broadcast.emit('location-update', data);
  // });

  socket.on('destroyed', function(data) {
    socket.broadcast.emit('destroyed', data);
  });

  socket.on('disconnect', function() {
    console.log('***player#',socket.id,'disconnected');
    players.splice(playerSpots[socket.id],1);
  });
  socket.on('bye', function() {
    console.log('***BYE***player#',socket.id,'disconnected');
    players.splice(playerSpots[socket.id],1);
  });
});

// Position.prototype.clone = function() {
//   return new Position(this.x, this.y, this.z, this.up, this.isUpPos, this.dir, this.isDirPos, this.left, this.isLeftPos);
// };

function handleMoves(socket, data) {
  console.log(data);

  var player = players[playerSpots[socket.id]].location;

  //clone-ish the position
  var newDirection = {};
  newDirection.x = player.x;
  newDirection.y = player.y;
  newDirection.z = player.z;
  newDirection.up = player.up;
  newDirection.isUpPos = player.isUpPos;
  newDirection.dir = player.dir;
  newDirection.isDirPos = player.isDirPos;
  newDirection.left = player.left;
  newDirection.isLeftPos = player.isLeftPos;

  switch(data.direction) {
    case 'left':
      newDirection.dir = player.left;
      newDirection.isDirPos = player.isLeftPos;
      newDirection.left = player.dir;
      newDirection.isLeftPos = !player.isDirPos;
      break;

    case 'right':
      newDirection.dir = player.left;
      newDirection.isDirPos = !player.isLeftPos;
      newDirection.left = player.dir;
      newDirection.isLeftPos = player.isDirPos;
      break;

    case 'up':
      newDirection.dir = player.up;
      newDirection.isDirPos = player.isUpPos;
      newDirection.up = player.dir;
      newDirection.isUpPos = !player.isDirPos;
      break;

    case 'down':
      newDirection.dir = player.up;
      newDirection.isDirPos = !player.isUpPos;
      newDirection.up = player.dir;
      newDirection.isUpPos = player.isDirPos;
      break;
  }

  data.newDirection = newDirection;
  console.log(data.newDirection);

  socket.emit('move-approved', data);
}


var startTime = null;

//game loop!
function loop() {
  if (startTime == null)
    startTime = Math.round(new Date().getTime());

  // console.log('**START**',startTime);

  // if (_players.length < 2)
  //   clearInterval(gameTickId);


  var now = Math.round(new Date().getTime() - startTime);

  // if (now % 1000 <= 10)
  //   for (var a in gameBoard)
  //     for (var b in gameBoard[a])
  //       for (var c in gameBoard[a][b])
  //         if (gameBoard[a][b][c])
  //           console.log(gameBoard[a][b][c]);

  // console.log('****NOW**',now);

  // console.log('gameboard',gameBoard.length);
  // console.log('gameboard',gameBoard[0].length);
  // console.log('gameboard',gameBoard[0][0].length);



  // for (var x = 1; x < 5; x++) {
  //   // console.log('x************',x,_players[x].dir);
  //   var pos = _players[x].dir[0] == '+';
  //   var dir = _players[x].dir[1];
  //   switch (dir) {
  //     case 'x':
  //       _players[x].x += pos ? 1:-1;
  //       break;

  //     case 'y':
  //       _players[x].y += pos ? 1:-1;
  //       break;

  //     case 'z':
  //       _players[x].z += pos ? 1:-1;
  //       break;
  //   }


  //   console.log(x,'(',_players[x].x,',',_players[x].y,',',_players[x].z,')');
  //   // gameBoard[_players[x].x][_players[x].y][_players[x].z] = x+1;
  //   // var i = Math.floor(Math.random()*100);
  //   // var j = Math.floor(Math.random()*100);
  //   // var k = Math.floor(Math.random()*100);
  //   // gameBoard[i][j][k] = 1;
  //   // console.log('rando');
  // }
  
  console.log(personToTick,'**');
  players[personToTick].socket.emit('tick', { now: now, players: _players } );
  personToTick = (personToTick+1)%players.length;
  // players[0].socket.volatile.broadcast.emit('tick', { now: now, players: _players } );
}

var personToTick = 0;

var gameBoard;
function setupGameBoard() {
  gameBoard = new Array(100);
  for (var i = 0; i < 100; i++) {
    gameBoard[i] = new Array(100);
    for (var j = 0; j < 100; j++)
      gameBoard[i][j] = new Array(100);
  }
  console.log(gameBoard.length);
  console.log(gameBoard[0].length);
  console.log(gameBoard[0][0].length);
}