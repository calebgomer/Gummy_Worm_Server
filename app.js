
/**
 * Module dependencies.
 */

var express = require('express')
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

//use the express error handler in development mode
app.configure('development', function(){
  app.use(express.errorHandler());
});

//pretty much anything you do will send the game play files
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
  io.set('log level', 1);
});

var players = [];
var playerSpots = {};

function Player(socket, name, color, location) {
  this.socket = socket;
  this.name = name;
  this.color = color;
  this.location = location;
  this.ready = false;
}

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

  console.log('new player');

  var location = {};
  location.y = 0;
  location.up = 'y';
  location.isUpPos = true;

  //for now all players start at the same place
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

  //save off this player's location in the list
  playerSpots[socket.id] = players.length;

  //push player into the list
  players.push(new Player(socket, data.name, data.color, location));

  //send player their starting location
  socket.emit('start-details', location);

  console.log('# players',players.length);
}


//wait for all players to be ready
var numReady = 0;
function playerReady(socket) {

  if (players[playerSpots[socket.id]].ready == false) {
    players[playerSpots[socket.id]].ready = true;
    console.log('player ',playerSpots[socket.id]+1,' is ready');
    numReady++;
  }

  if (numReady == players.length)
    startGame();
}


//start the game timer
function startGame() {
  if (players.length >= 1)
    gameTickId = setInterval(tick, 250/4);
}


//handle new user connections
io.sockets.on('connection', function(socket) {

  //welcome new player, give them their ID
  socket.emit('send-details', { /* 'nuff said */ });

  //get player details
  socket.on('player-details', function(data) { addPlayer(socket, data); });

  //player is ready to go
  socket.on('ready-to-go', function() { playerReady(socket); });

  //player requests move
  socket.on('request-move', function(data) { handleMoves(socket, data); });

  //figure out how best to handle a disconnect?
  socket.on('disconnect', function() {
    console.log('***player#',socket.id,'disconnected');
    if (playerSpots[socket.id])
      players.splice(playerSpots[socket.id], 1);
  });

  //figure out how best to handle a disconnect?
  socket.on('bye', function() {
    console.log('***BYE***player#',socket.id,'disconnected');
    socket.broadcast.emit('player-left', {/* fill in later */} );
    if (playerSpots[socket.id])
      players.splice(playerSpots[socket.id], 1);
  });
});


//process and make decisions on move requests
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

  //put the new direction in the data to send back
  data.newDirection = newDirection;
  //update the player's location/direction with the new one
  players[playerSpots[socket.id]].location = newDirection;

  socket.emit('move-approved', data);
}

//milliseconds the game started
var startTime = null;

//player to update this tick
var personToTick = 0;

//game seconds!
function tick() {

  //initialize the game starting time
  if (startTime == null)
    startTime = Math.round(new Date().getTime());

  //milliseconds since the game started
  var now = Math.round(new Date().getTime() - startTime);

  //locations of each player, will be sent to the one lucky player this tick
  var playerLocations = [];

  //move each player 1 block on this tick
  for (var i in players) {
    var player = players[i];
    playerLocations.push(player.location);

    switch (player.location.dir) {

      case 'x':
        player.location.x += player.location.isDirPos ? 1 : -1;
        break;

      case 'y':
        player.location.y += player.location.isDirPos ? 1 : -1;
        break;

      case 'z':
        player.location.z += player.location.isDirPos ? 1 : -1;
        break;
    }

    // if (i == 1)
      console.log(player.location.x, player.location.y, player.location.z, 'moving', player.location.isDirPos?'+':'-',player.location.dir,'direction');
  }
  console.log('');

  //update one player this tick
  if (players[personToTick] && players[personToTick].socket)
    players[personToTick].socket.emit('tick', { now: now, players: playerLocations } );

  //send update to next player on next tick
  personToTick = (personToTick + 1) % players.length;
}

//the logical game board
var gameBoard;
var gameBoardWidth = 100;
var gameBoardHeight = 100;
var gameBoardDepth = 100;
function setupGameBoard() {
  gameBoard = new Array(gameBoardWidth);
  for (var i = 0; i < gameBoardWidth; i++) {
    gameBoard[i] = new Array(gameBoardHeight);
    for (var j = 0; j < gameBoardHeight; j++)
      gameBoard[i][j] = new Array(gameBoardDepth);
  }
}