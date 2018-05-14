var collision = require ("./collision.js");
var Player = require ("./player.js");
var Gun = require ("./gun.js");
var protocol = require ("./protocol.js");
var bProtocol = require ("./binaryProtocol.js");

const updateRateMs = 50;
let playerNames = 0;

/* Create the values for our screen width and height */
var width = 800;
var height = 600;
let players = collision.players;

var ws = require("nodejs-websocket");

ws.setBinaryFragmentation(128);

function tellEveryoneAboutTheNewPlayer(player) {
  let buffer = new ArrayBuffer(512);
  let singlePlayer = {};
  singlePlayer[player.name] = player;
  let bytesWritten = bProtocol.encodeMessage(bProtocol.ACTION_JOINED, singlePlayer, buffer);

  for ( let name in players ) {
    let u8b = new Uint8Array(buffer, 0, bytesWritten);
    let player = players[name];
    player.conn.sendBinary(u8b);
  }
}

function tellEveryoneAboutEveryone() {
  let buffer = new ArrayBuffer(512);
  let bytesWritten = bProtocol.encodeMessage(bProtocol.ACTION_UPDATE, players, buffer);

  for ( let name in players ) {
    let player = players[name];
    if (player.readyForMore) {
      let u8b = new Uint8Array(buffer, 0, bytesWritten);
      player.conn.sendBinary(u8b);
      player.readyForMore = false;
    }
  }
}

function tellEveryoneAboutTheLeftPlayer(player) {
  let buffer = new ArrayBuffer(512);
  let singlePlayer = {};
  singlePlayer[player.name] = player;
  let bytesWritten = bProtocol.encodeMessage(bProtocol.ACTION_LEFT, singlePlayer, buffer);

  for ( let name in players ) {
    let player = players[name];
    let u8b = new Uint8Array(buffer, 0, bytesWritten);
    player.conn.sendBinary(u8b);
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

  let deadPlayers = [];

  // let str = "";

  for (let name in players) {
    let player = players[name];
    player.update(timeScale, width, height);

    // str += `${name}_${player.alive}\t`
  }

  // console.log(str);

  tellEveryoneAboutEveryone();

}, updateRateMs);

var server = ws.createServer(function (conn, req) {

  var player = new Player(playerNames, conn);
  player.x = Math.random() * width;
  player.y = Math.random() * height;
  players[player.name] = player;
  playerNames++;

  conn.on("binary", function(player, inStream) {
    var data = new ArrayBuffer(1)
    inStream.on("readable", function () {
      var newData = inStream.read()
      if (newData) {
        let bitFlags = new Uint8Array(newData);
        if (player.alive) {
          bProtocol.decodeBitFlags(player, bitFlags[0]);
        }
        player.readyForMore = true;
      }
    });
  }.bind(this, player));

  conn.on("close", function (code, reason) {
    player.readyForMore = false;
    delete players[player.name];
    tellEveryoneAboutTheLeftPlayer(player);
    console.log("- Clients: " , Object.keys(players).length)
  });

  conn.on('error', function(code, reason){
    if (code.errno !== 'ECONNRESET') console.log('error', code, reason);
  });

  tellEveryoneAboutTheNewPlayer(player);

  console.log("+ Clients: " , Object.keys(players).length)

}).listen(8001);

server.on('error', () => console.log('errored'));