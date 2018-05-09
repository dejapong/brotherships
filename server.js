var Player = require ("./player.js");
var Gun = require ("./gun.js");
var protocol = require ("./protocol.js");

const updateRateMs = 50;
let playerNames = 0;
/* Create the values for our screen width and height */
var width = 800;
var height = 600;
let players = {};

var ws = require("nodejs-websocket");

function updatePlayerState(report) {
  if (report.action == "update") {
    players[report.name].turningLeft = report.turningLeft;
    players[report.name].turningRight = report.turningRight;
    players[report.name].accelerating = report.accelerating;
    players[report.name].firing = report.firing;
  }
}

function tellEveryoneAboutTheNewPlayer(player) {

  let obj = {
    action: "newPlayer",
    name: player.name,
    player: protocol.encode(player)
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
      obj.others[name] = protocol.encode(player);
    }
  }

  actionMessage = JSON.stringify(obj);
  player.conn.sendText(actionMessage);
}

function tellEveryoneAboutEveryone(){

  let obj = {
    action:"update",
    players: {}
  };

  for (let name in players) {
    obj.players[name] = protocol.encode(players[name]);
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
    player.update(timeScale, width, height);
  }

  tellEveryoneAboutEveryone();

}, updateRateMs);

var server = ws.createServer(function (conn, req) {

  var player = new Player(playerNames, conn);
  player.x = Math.random() * width;
  player.y = Math.random() * height;
  players[player.name] = player;
  playerNames++;

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