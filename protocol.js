
let shipColors = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#00ffff",
  "#ff00ff",
  "#ffff00",
];

function encodeBody (body) {
  return [
    body.alive ? 1 : 0,
    parseInt(body.x.toFixed(0)),
    parseInt(body.y.toFixed(0)),
    parseFloat(body.speedX.toFixed(2)),
    parseFloat(body.speedY.toFixed(2)),
    parseFloat(body.facing.toFixed(1)),
  ]
}

function decodeBody(message, body) {
  body.alive = parseInt(message[0]);
  body.x = parseInt(message[1]);
  body.y = parseInt(message[2]);
  body.speedX = parseFloat(message[3]);
  body.speedY = parseFloat(message[4]);
  body.facing = parseFloat(message[5]);
}

function encodeBullet(bullet) {
  let encoding = encodeBody(bullet);
  encoding[6] = bullet.t;
  encoding[7] = bullet.Vz0;
  return encoding;
}

function decodeBullet(message, bullet) {
  decodeBody(message, bullet);
  bullet.t = message[6];
  bullet.Vz0 = message[7];
  bullet.alive = true;
}

function encode(player) {
  let bullets = [];
  let bodyEncoding = encodeBody(player);

  let playerEncoding = [
    player.accelerating ? 1 : 0,
    player.turningLeft ? 1 : 0,
    player.turningRight ? 1 : 0,
    player.firing ? 1 : 0,
  ];

  let bulletEncodings = [];
  for (let bullet of player.gun.bullets) {
    if (bullet.alive) {
      bulletEncodings.push(encodeBullet(bullet));
    }
  }

  playerEncoding.push(bulletEncodings);

  return bodyEncoding.concat(playerEncoding);
}

function decode(message, player) {

  decodeBody(message, player);

  player.accelerating = message[6];
  player.turningLeft = message[7];
  player.turningRight = message[8];
  player.firing = message[9];
  player.color = shipColors[player.name % shipColors.length];

  let bulletEncodings = message[10];
  for (let i =0; i < player.gun.bullets.length; i++) {
    let bullet = player.gun.bullets[i];
    if (i < bulletEncodings.length) {
      decodeBullet(bulletEncodings[i], bullet);
      bullet.color = player.color;
    } else {
      bullet.alive = false;
    }
  }
}

if (typeof module != "undefined") {
  module.exports = {
    encode : encode,
    decode : decode
  }
}