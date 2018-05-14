if (typeof require !== "undefined") {
  var Body = require("./body.js");
  var {Gun} = require("./gun.js");
}

/*
 * This function returns a rotated point, based off an original point, a center of rotation, and an angle.
 *
 * point  The original, unrotated point
 * center A point to rotate the original point around
 * angle  The angle in radians to rotate the point
 *
 * returns a new, rotated point.
 */
function getRotatedPoint(point, center, angle) {
  return {
    x: Math.cos(angle) * (point.x - center.x) - Math.sin(angle) * (point.y - center.y) + center.x,
    y: Math.sin(angle) * (point.x - center.x) + Math.cos(angle) * (point.y - center.y) + center.y,
  };
}

function Player(name, conn) {
  this.name = name;
  this.conn = conn;
  Body.call(this)
  this.maxSpeed = 5;
  this.rateOfTurn = 0.17;   /* Radians per tick that the ship will turn */
  this.rateOfAccel = 0.18;  /* Pixels per tick per tick that the spaceship accelerates */
  this.turningLeft = false;
  this.turningRight = false;
  this.accelerating = false;
  this.firing = false;
  this.gun = new Gun(this);
  this.gun.facing = Math.PI / 2;
  this.size = 64;

  if (typeof Image != "undefined") {
    this.shipImage = new Image();
    this.shipImage.src = "images/ship.png";
    this.wreckageImage = new Image();
    this.wreckageImage.src = "images/wreckage.png";
  }
}


Player.prototype = {

  update: function(timeScale, width, height) {

    if (this.alive) {

      if (this.firing) {
        this.gun.fire(this);
        this.firing = false;
      }

      if (this.turningLeft) {
        this.facing -= this.rateOfTurn * timeScale;
      }

      if (this.turningRight) {
        this.facing += this.rateOfTurn * timeScale;
      }

      Body.prototype.update.call(this, timeScale, width, height);
    }

    this.gun.update(timeScale, width, height);
  },

  draw : function(){

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facing);
    let img = this.alive ? this.shipImage : this.wreckageImage;
    ctx.drawImage(img, -this.size/2, -this.size/2 , this.size, this.size);
    ctx.restore();

    /* If the user is accelerating, draw the flame using points 2,3,4 */
    if (this.accelerating) {

    }

    this.gun.draw();
  }
}

if (typeof module != "undefined") {
  module.exports = Player;
}