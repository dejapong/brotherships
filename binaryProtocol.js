if (typeof require !=  "undefined") {
  let Player = require("./player.js");
}

/*
  Protocol for all actions.

  Actions

    player joined   action = 0, numPlayers = 1
    player left     action = 1, numPlayers = 1, only player name follows
    player update   action = 2, numPlayers = x

  BitFlags

    Pos Meaning
    0   turningLeft
    1   turningRight
    2   accelerating
    3   firing

  Structure
    uint8   action
    uint8   numPlayers in message

    uint8   Player "Name"
    uint8   bitFlags
    uint8   numBullets
    uint8   padding

    uint16  x
    uint16  y

    uint16  speedX -10 to 10
    uint16  speedY -10 to 10
    uint16  facing -Pi to Pi

    //bullets
    uint16  x
    uint16  y
    uint16  speedX -10 to 10
    uint16  speedY -10 to 10
    uint16  facing -Pi to Pi
    uint16   t
    uint16   V0
    uint16   U0

*/
const PI2 = 2*Math.PI;

const ACTION_JOINED = 0;
const ACTION_LEFT = 1;
const ACTION_UPDATE = 2;

const NUM_FLOAT16_VALS = 65535;
const INV_NUM_FLOAT16_VALS = 1/NUM_FLOAT16_VALS;

const timeRange = [0,1000];
const speedRange = [-20, 20];
const angleRange = [-PI2, PI2];

const ALIVE_BIT_SHIFT = 0;
const TURNING_LEFT_BIT_SHIFT = 1;
const TURNING_RIGHT_BIT_SHIFT = 2;
const ACCELERATING_BIT_SHIFT = 3;
const FIRING_BIT_SHIFT = 4;

const ALIVE_BIT_MASK = 1 << ALIVE_BIT_SHIFT;
const TURNING_LEFT_BIT_MASK = 1 << TURNING_LEFT_BIT_SHIFT;
const TURNING_RIGHT_BIT_MASK = 1 << TURNING_RIGHT_BIT_SHIFT;
const ACCELERATING_BIT_MASK = 1 << ACCELERATING_BIT_SHIFT;
const FIRING_BIT_MASK = 1 << FIRING_BIT_SHIFT;

var encodeFloat16 = function(float, range) {
  return NUM_FLOAT16_VALS * (float - range[0]) / (range[1] - range[0]);
}

var decodeFloat16 = function(float, range) {
  return float * INV_NUM_FLOAT16_VALS * (range[1] - range[0]) + range[0];
}

var encodeBitFlags = function(player) {
  let bitFlags = 0;
  bitFlags |= player.alive << ALIVE_BIT_SHIFT;
  bitFlags |= player.turningLeft << TURNING_LEFT_BIT_SHIFT;
  bitFlags |= player.turningRight << TURNING_RIGHT_BIT_SHIFT;
  bitFlags |= player.accelerating << ACCELERATING_BIT_SHIFT;
  bitFlags |= player.firing << FIRING_BIT_SHIFT;
  return bitFlags;
}

var decodeBitFlags = function(player, bitFlags) {
  player.alive = (bitFlags & ALIVE_BIT_MASK) != 0;
  player.turningLeft = (bitFlags & TURNING_LEFT_BIT_MASK) != 0;
  player.turningRight = (bitFlags & TURNING_RIGHT_BIT_MASK) != 0;
  player.accelerating = (bitFlags & ACCELERATING_BIT_MASK) != 0;
  player.firing = (bitFlags & FIRING_BIT_MASK) != 0;
}

var encodeBody = function(body, buffer, offset) {
  let u16b = new Uint16Array(buffer, offset);
  let data = [
    body.x,
    body.y,
    encodeFloat16(body.speedX, speedRange),
    encodeFloat16(body.speedY, speedRange),
    encodeFloat16(body.facing % PI2, angleRange),
  ]
  u16b.set(data);
  return data.length * Uint16Array.BYTES_PER_ELEMENT;
}

var decodeBody = function(body, buffer, offset) {
  let u16b = new Uint16Array(buffer, offset);
  body.x = u16b[0];
  body.y = u16b[1];
  body.speedX = decodeFloat16(u16b[2], speedRange);
  body.speedY = decodeFloat16(u16b[3], speedRange);
  body.facing = decodeFloat16(u16b[4], angleRange);
  return 5 * Uint16Array.BYTES_PER_ELEMENT;
}

var encodeBullet = function(bullet, buffer, offset) {
  let bytesWritten = encodeBody(bullet, buffer, offset);
  let u16b = new Uint16Array(buffer, offset + bytesWritten);
  let data = [
    encodeFloat16(bullet.t, timeRange),
    encodeFloat16(bullet.U0, speedRange),
    encodeFloat16(bullet.Vz0, speedRange ),
  ];
  u16b.set(data);

  return bytesWritten + data.length * Uint16Array.BYTES_PER_ELEMENT;
}

var decodeBullet = function(bullet, buffer, offset) {
  let bytesRead = decodeBody(bullet, buffer, offset);
  let u16b = new Uint16Array(buffer, offset + bytesRead);
  bullet.alive = true;
  bullet.t = decodeFloat16(u16b[0], timeRange);
  bullet.U0 = decodeFloat16(u16b[1], speedRange);
  bullet.Vz0 = decodeFloat16(u16b[2], speedRange);

  return bytesRead + 3 * Uint16Array.BYTES_PER_ELEMENT;
}

var encodePlayer = function(player, buffer, offset) {
  let u8b = new Uint8Array(buffer, offset);
  let bitFlags = encodeBitFlags(player);

  let leader = [
    player.name,
    bitFlags,
    player.gun.livingBullets,
    0 /* padding */
  ];
  u8b.set(leader);
  let bytesWritten = leader.length * Uint8Array.BYTES_PER_ELEMENT;

  bytesWritten += encodeBody(player, buffer, offset + bytesWritten);

  for (let bullet of player.gun.bullets) {
    if (bullet.alive) {
      bytesWritten += encodeBullet(bullet, buffer, offset + bytesWritten);
    }
  }

  return bytesWritten;
}

var decodePlayer = function(player, buffer, offset) {
  let bytesRead = 0;
  let u8b = new Uint8Array(buffer, offset);
  player.name = u8b[0];
  let bitFlags = u8b[1];
  player.gun.livingBullets = u8b[2];
  decodeBitFlags(player, bitFlags);

  /* skip padding u8b[3] */

  bytesRead += 4 * Uint8Array.BYTES_PER_ELEMENT;
  bytesRead += decodeBody(player, buffer, offset + bytesRead);

  for (let i = 0 ; i < player.gun.livingBullets; i++) {
    bytesRead += decodeBullet(player.gun.bullets[i], buffer, offset + bytesRead);
  }

  for (let i = player.gun.livingBullets; i < player.gun.maxBullets; i++) {
    player.gun.bullets[i].alive = false;
  }

  return bytesRead;
}

var encodeMessage = function(actionId, players, buffer) {

  let bytesWritten = 0;
  let u8b = new Uint8Array(buffer, bytesWritten);
  let numPlayers = Object.keys(players).length;

  let data = [
    actionId,
    numPlayers
  ];

  u8b.set(data, 0);

  bytesWritten += data.length * Uint8Array.BYTES_PER_ELEMENT;

  for (let name in players) {
    let player = players[name];
    bytesWritten += encodePlayer(player, buffer, bytesWritten);
  }

  return bytesWritten;
}

var decodeMessage = function(players, message) {
  let bytesRead = 0;
  let u8b = new Uint8Array(message, bytesRead);
  let actionId = u8b[0];
  let playerLength = u8b[1];

  bytesRead += 2 * Uint8Array.BYTES_PER_ELEMENT;

  if (actionId == ACTION_LEFT) {
    let player = new Player();
    bytesRead += decodePlayer(player, message, bytesRead);
    if (players[player.name]) {
      delete players[player.name];
    }
  } else {
    for (let i =0; i < playerLength; i++) {
      let name = u8b[bytesRead];

      if (!(name in players)) {
        let shipColors = [
          "#ff0000",
          "#00ff00",
          "#0000ff",
          "#00ffff",
          "#ff00ff",
          "#ffff00",
        ];
        players[name] = new Player();
        players[name].color = shipColors[name % shipColors.length];
      }

      bytesRead += decodePlayer(players[name], message, bytesRead);

    }
  }

  return bytesRead;
}

if (typeof module != "undefined") {
  module.exports = {
    encodeFloat16: encodeFloat16,
    decodeFloat16: decodeFloat16,
    encodeBody:    encodeBody,
    decodeBody:    decodeBody,
    encodeBullet:  encodeBullet,
    decodeBullet:  decodeBullet,
    encodePlayer:  encodePlayer,
    decodePlayer:  decodePlayer,
    encodeMessage: encodeMessage,
    decodeMessage: decodeMessage,
    encodeBitFlags: encodeBitFlags,
    decodeBitFlags: decodeBitFlags,
    NUM_FLOAT16_VALS: NUM_FLOAT16_VALS,
    INV_NUM_FLOAT16_VALS: INV_NUM_FLOAT16_VALS,
    ACTION_JOINED: ACTION_JOINED,
    ACTION_LEFT: ACTION_LEFT,
    ACTION_UPDATE: ACTION_UPDATE,
  };
}
