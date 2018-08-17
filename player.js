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
  Body.call(this);
  this.maxSpeed = 5;
  this.rateOfTurn = 0.17;   /* Radians per tick that the ship will turn */
  this.rateOfAccel = 0.18;  /* Pixels per tick per tick that the spaceship accelerates */
  this.turningLeft = false;
  this.turningRight = false;
  this.accelerating = false;

  this.guns = [new Gun(this), new Gun(this)];
  this.guns[0].facing = -Math.PI / 2;
  this.guns[1].facing = Math.PI / 2;

  this.size = 64;
  this.length = 64;
  this.width = 25;

  if (typeof Image != "undefined") {
    this.shipImage = new Image();
    this.shipImage.src = "images/Ship_red_64x64.png";
    this.wreckageImage = new Image();
    this.wreckageImage.src = "images/wreckage.png";
  }

  /*    * 0
       / \
    5 *   * 1
      |   |
      | x |
      |   |
    4 *   * 2
       \ /
        * 3
  */

  let w2 = this.width/2;
  let l2 = this.length/2;
  let lBow = this.length/4;
  let lStern = this.length/2.5;
  this.vertices = [
    [   0,    - l2],
    [  w2,  - lBow],
    [  w2,    lStern],
    [   0,      l2],
    [- w2,    lStern],
    [- w2,  - lBow],
  ];

}


Player.prototype = {

  clientUpdate : function() {
    for (let gun of this.guns) {
      gun.clientUpdate();
    }
  },

  update: function(timeScale, width, height) {

    if (this.alive) {

      for (let gun of this.guns) {
        if (gun.firing) {
          gun.fire();
        }
      }

      if (this.turningLeft) {
        this.facing -= this.rateOfTurn * timeScale;
      }

      if (this.turningRight) {
        this.facing += this.rateOfTurn * timeScale;
      }

      Body.prototype.update.call(this, timeScale, width, height);
    }

    for (let gun of this.guns) {
      gun.update(timeScale, width, height);
    }

  },

  draw : function(){

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facing);
    ctx.strokeStyle = this.color;

    if (this.alive) {
      ctx.beginPath();
      ctx.moveTo(this.vertices[0][0], this.vertices[0][1])
      for (let i =1; i< this.vertices.length; i++) {
        ctx.lineTo(this.vertices[i][0],this.vertices[i][1]);
      }
      ctx.closePath();
      ctx.stroke();
    }

    let img = this.alive ? this.shipImage : this.wreckageImage;
    ctx.drawImage(img, -this.size/2, -this.size/2 , this.size, this.size);
    ctx.restore();

    for (let gun of this.guns) {
      gun.draw();
    }
  }
}

if (typeof module != "undefined") {
  module.exports = Player;
}