let players = {};

function checkBulletSplash(x,y) {
  let deadPlayers = [];

  for (let name in players) {
    let player = players[name];
    if (Math.abs(player.x - x) < player.size) {
      if (Math.abs(player.y - y) < player.size) {
        deadPlayers.push(player);
      }
    }
  }

  for (let dead of deadPlayers) {
    players[dead.name].alive = false;
  }

}

module.exports = {
  players : players,
  checkBulletSplash: checkBulletSplash
}