
function encode(player) {
  return [
    player.x.toFixed(0),
    player.y.toFixed(0),
    player.speedX.toFixed(2),
    player.speedY.toFixed(2),
    player.facing.toFixed(1),
    player.accelerating ? 1 : 0,
    player.turningLeft ? 1 : 0,
    player.turningRight ? 1 : 0,
    player.firing ? 1 : 0
  ]
}

function decode(message, player) {
  player.x = parseFloat(message[0]);
  player.y = parseFloat(message[1]);
  player.speedX = parseFloat(message[2]);
  player.speedY = parseFloat(message[3]);
  player.facing = parseFloat(message[4]);
  player.accelerating = message[5];
  player.turningLeft = message[6];
  player.turningRight = message[7];
  player.firing = message[8];
}

if (typeof module != "undefined") {
  module.exports = {
    encode : encode,
    decode : decode
  }
}