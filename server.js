const updateRateMs = 33;
let playerNames = 0;
/* Create the values for our screen width and height */
var width = 500;
var height = 500;
let players = {};

var ws = require("nodejs-websocket");

function Player(conn) {
  this.name = playerNames;
  this.conn = conn;
  playerNames++;
  this.x = Math.random() * width;      /* X (horizontal) location of our spaceship in pixels from the left side of the screen. Start it in the middle. (half the width) */
  this.y = Math.random() * height;     /* Y (vertical) location of our spaceship in pixels from the top of the screen. Start it in the middle. (half the height) */
  this.facing = 0;         /* Angle that the spaceship is facing */
  this.speedX = 0.0;       /* Current speed of the ship in the X direction in pixels per tick */
  this.speedY = 0.0;       /* Current speed of the ship in the Y direction in pixels per tick */
  this.rateOfTurn = 0.1;   /* Radians per tick that the ship will turn */
  this.rateOfAccel = 0.08;  /* Pixels per tick per tick that the spaceship accelerates */
  this.turningLeft = false;
  this.turningRight = false;
  this.accelerating = false;
}

function updatePlayerState(report) {
  if (report.action == "update") {
    players[report.name].turningLeft = report.turningLeft;
    players[report.name].turningRight = report.turningRight;
    players[report.name].accelerating = report.accelerating;
  }
}

function tellEveryoneAboutTheNewPlayer(player) {

  let obj = {
    action : "newPlayer",
    name : player.name,
    x : player.x,
    y : player.y,
  };

  let actionMessage = JSON.stringify(obj);
  for (let name in players) {
    if (name != player.name) {
      players[name].conn.sendText(actionMessage);
    }
  }
}

function tellThePlayerAboutHisNewWorld(player) {

  let obj = {
    action : "initialize",
    name : player.name,
    x : player.x,
    y : player.y,
    others : {}
  }

  for (let name in players) {
    if (name != player.name) {
      let player = players[name];
      obj.others[name] = { x: player.x, y: player.y };
    }
  }

  actionMessage = JSON.stringify(obj);
  player.conn.sendText(actionMessage);
}

function tellEveryoneAboutEveryone(){

  let obj = {
    action:"update",
    players:{}
  };

  for (let name in players) {
    let player = players[name];
    obj.players[name] = {
      x: player.x,
      y: player.y,
      facing: player.facing,
      accelerating : player.accelerating
    };
  }

  let message = JSON.stringify(obj);

  for (let name in players) {
    players[name].conn.send(message);
  }

}

var lastTime = 0;
setInterval(function() {

  let nowMs = (new Date().getTime());
  let timeScale = 1;
  let elapsedMs = (nowMs - lastTime);
  if (lastTime != 0) {
    timeScale = elapsedMs / (updateRateMs);
  }
  lastTime = nowMs;

  for (let name in players) {
    let player = players[name];

    if (player.turningLeft) {
      player.facing -= player.rateOfTurn * timeScale;
    }

    if (player.turningRight) {
      player.facing += player.rateOfTurn * timeScale;
    }

    if (player.accelerating) {
      player.speedX += player.rateOfAccel * Math.sin(player.facing) * timeScale;
      player.speedY -= player.rateOfAccel * Math.cos(player.facing) * timeScale;
    }

    player.x += player.speedX;
    player.y += player.speedY;

    if (player.x < 0){
      player.x = 1;
      player.speedX = -player.speedX / 2;
    }
    if (player.x > width){
      player.x = width-1;
      player.speedX = -player.speedX / 2;
    }
    if (player.y < 0){
      player.y = 1;
      player.speedY = -player.speedY / 2;
    }
    if (player.y > height) {
      player.y = height-1;
      player.speedY = -player.speedY / 2;
    }
  }

  tellEveryoneAboutEveryone();

}, updateRateMs);

var server = ws.createServer(function (conn, req) {

  var player = new Player(conn);
  players[player.name] = player;

  conn.on("text", function (str) {
    updatePlayerState(JSON.parse(str));
  });

  conn.on("close", function (code, reason) {
    /* Notify all players that this player is gone */
    for (let name in players) {
      if (name != player.name) {
        let playerConn = players[name].conn;
        playerConn.sendText(JSON.stringify({
          action:"removePlayer",
          name: player.name
        }));
      }
    }
    delete players[player.name];
    console.log("- Clients: " , Object.keys(players).length)
  });

  conn.on('error', function(code, reason){
    if (code.errno !== 'ECONNRESET') console.log('error', code, reason);
  });

  tellEveryoneAboutTheNewPlayer(player);
  tellThePlayerAboutHisNewWorld(player);

  console.log("+ Clients: " , Object.keys(players).length)

}).listen(8001);

server.on('error', () => console.log('errored'));