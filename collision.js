let players = {};

function insidePolygon(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

function checkBulletSplash(x,y) {
  let deadPlayers = [];
  for (let name in players) {
    let player = players[name];
    if (Math.abs(player.x - x) < player.width) {
      if (Math.abs(player.y - y) < player.length) {
        if (insidePolygon([x - player.x, y - player.y], player.vertices)) {
          deadPlayers.push(player);
        }
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