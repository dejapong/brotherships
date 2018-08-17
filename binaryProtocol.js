if (typeof require !=  "undefined") {
  var Player = require("./player.js");
}

const PI2 = 2 * Math.PI;

const ACTION_JOINED = 0;
const ACTION_LEFT = 1;
const ACTION_UPDATE = 2;
const ACTION_IDENTITY = 3;

const NUM_FLOAT16_VALS = 65535;
const INV_NUM_FLOAT16_VALS = 1/NUM_FLOAT16_VALS;

const timeRange = [0, 100];
const speedRange = [-20, 20];
const angleRange = [-PI2, PI2];

const ALIVE_BIT_SHIFT = 0;
const TURNING_LEFT_BIT_SHIFT = 1;
const TURNING_RIGHT_BIT_SHIFT = 2;
const ACCELERATING_BIT_SHIFT = 3;
const FIRING0_BIT_SHIFT = 4;
const FIRING1_BIT_SHIFT = 5;

const ALIVE_BIT_MASK = 1 << ALIVE_BIT_SHIFT;
const TURNING_LEFT_BIT_MASK = 1 << TURNING_LEFT_BIT_SHIFT;
const TURNING_RIGHT_BIT_MASK = 1 << TURNING_RIGHT_BIT_SHIFT;
const ACCELERATING_BIT_MASK = 1 << ACCELERATING_BIT_SHIFT;
const FIRING0_BIT_MASK = 1 << FIRING0_BIT_SHIFT;
const FIRING1_BIT_MASK = 1 << FIRING1_BIT_SHIFT;

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
  bitFlags |= player.guns[0].firing << FIRING0_BIT_SHIFT;
  bitFlags |= player.guns[1].firing << FIRING1_BIT_SHIFT;
  return bitFlags;
}

var decodeBitFlags = function(player, bitFlags) {
  player.alive = (bitFlags & ALIVE_BIT_MASK) != 0;
  player.turningLeft = (bitFlags & TURNING_LEFT_BIT_MASK) != 0;
  player.turningRight = (bitFlags & TURNING_RIGHT_BIT_MASK) != 0;
  player.accelerating = (bitFlags & ACCELERATING_BIT_MASK) != 0;
  player.guns[0].firing = (bitFlags & FIRING0_BIT_MASK) != 0;
  player.guns[1].firing = (bitFlags & FIRING1_BIT_MASK) != 0;
  return 1 * Uint8Array.BYTES_PER_ELEMENT;
}

var encodeClientMessage = function(player, buffer) {
  let bytesWritten = 0;
  let u8b = new Uint8Array(buffer);
  let data = [
    encodeBitFlags(player),
    parseInt(player.guns[0].firingPower),
    parseInt(player.guns[1].firingPower),
  ];

  u8b.set(data, 0);
  bytesWritten += data.length * Uint8Array.BYTES_PER_ELEMENT;

  return bytesWritten;
}

var decodeClientMessage = function(player, buffer) {
  let bytesRead = 0;
  let u8b = new Uint8Array(buffer);
  bytesRead += decodeBitFlags(player, u8b[0]);
  player.guns[0].firingPower = u8b[1];
  player.guns[1].firingPower = u8b[2];
  bytesRead += 2 * Uint8Array.BYTES_PER_ELEMENT;
  return bytesRead;
}

var encodeBody = function(body, buffer, offset) {
  let u16b = new Uint16Array(buffer, offset);
  let data = [
    body.x,
    body.y,
    encodeFloat16(body.speedX, speedRange),
    encodeFloat16(body.speedY, speedRange),
    encodeFloat16(body.facing % PI2, angleRange),
  ];
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
  let u16b = new Uint16Array(buffer, offset);
  u16b = new Uint16Array(buffer, offset + bytesWritten);
  let data = [
    encodeFloat16(bullet.t, timeRange),
    encodeFloat16(bullet.Vz0, speedRange),
  ];
  u16b.set(data, bytesWritten);
  return bytesWritten + data.length * Uint16Array.BYTES_PER_ELEMENT;
}

var decodeBullet = function(bullet, buffer, offset) {
  let bytesRead = decodeBody(bullet, buffer, offset);
  let u16b = new Uint16Array(buffer, offset + bytesRead);
  bullet.alive = true;
  bullet.t = decodeFloat16(u16b[0], timeRange);
  bullet.Vz0 = decodeFloat16(u16b[1], speedRange);
  return bytesRead + 2 * Uint16Array.BYTES_PER_ELEMENT;
}

var encodePlayer = function(player, buffer, offset) {
  let u8b = new Uint8Array(buffer, offset);
  let bitFlags = encodeBitFlags(player);

  let leader = [
    player.name,
    bitFlags,
    player.guns[0].livingBullets,
    player.guns[1].livingBullets
  ];

  u8b.set(leader);
  let bytesWritten = leader.length * Uint8Array.BYTES_PER_ELEMENT;

  bytesWritten += encodeBody(player, buffer, offset + bytesWritten);

  for (let i =0; i < 2; i++) {
    for (let bullet of player.guns[i].bullets) {
      if (bullet.alive) {
        bytesWritten += encodeBullet(bullet, buffer, offset + bytesWritten);
      }
    }
  }

  return bytesWritten;
}

var decodePlayer = function(player, buffer, offset) {
  let bytesRead = 0;
  let u8b = new Uint8Array(buffer, offset);
  player.name = u8b[0];
  let bitFlags = u8b[1];
  player.guns[0].livingBullets = u8b[2];
  player.guns[1].livingBullets = u8b[3];
  decodeBitFlags(player, bitFlags);

  bytesRead += 4 * Uint8Array.BYTES_PER_ELEMENT;
  bytesRead += decodeBody(player, buffer, offset + bytesRead);

  for (let i =0; i < 2; i++) {
    for (let j = 0 ; j < player.guns[i].livingBullets; j++) {
      bytesRead += decodeBullet(player.guns[i].bullets[j], buffer, offset + bytesRead);
    }

    for (let j = player.guns[i].livingBullets; j < player.guns[i].maxBullets; j++) {
      player.guns[i].bullets[j].alive = false;
    }
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

var decodeMessage = function(players, message, onIdentified) {
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

      if (actionId = ACTION_IDENTITY) {
        onIdentified(players[name]);
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
    encodeClientMessage: encodeClientMessage,
    decodeClientMessage: decodeClientMessage,
    NUM_FLOAT16_VALS: NUM_FLOAT16_VALS,
    INV_NUM_FLOAT16_VALS: INV_NUM_FLOAT16_VALS,
    ACTION_JOINED: ACTION_JOINED,
    ACTION_LEFT: ACTION_LEFT,
    ACTION_UPDATE: ACTION_UPDATE,
  };
}
