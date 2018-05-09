
function encodeBody (body) {
  return [
    parseInt(body.x.toFixed(0)),
    parseInt(body.y.toFixed(0)),
    parseFloat(body.speedX.toFixed(2)),
    parseFloat(body.speedY.toFixed(2)),
    parseFloat(body.facing.toFixed(1)),
  ]
}

function decodeBody(message, body) {
  body.x = parseInt(message[0]);
  body.y = parseInt(message[1]);
  body.speedX = parseFloat(message[2]);
  body.speedY = parseFloat(message[3]);
  body.facing = parseFloat(message[4]);
}

function encodeBullet(bullet) {
  let encoding = encodeBody(bullet);
  encoding[5] = bullet.t;
  encoding[6] = bullet.Vz0;
  return encoding;
}

function decodeBullet(message, bullet) {
  decodeBody(message, bullet);
  bullet.t = message[5];
  bullet.Vz0 = message[6];
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

  player.accelerating = message[5];
  player.turningLeft = message[6];
  player.turningRight = message[7];
  player.firing = message[8];

  let bulletEncodings = message[9];
  for (let i =0; i < player.gun.bullets.length; i++) {
    if (i < bulletEncodings.length) {
      decodeBullet(bulletEncodings[i], player.gun.bullets[i]);
    } else {
      player.gun.bullets[i].alive = false;
    }
  }
}

if (typeof module != "undefined") {
  module.exports = {
    encode : encode,
    decode : decode
  }
}