if (typeof require !== "undefined") {
  var Body = require("./body.js");
  var Gun = require("./gun.js");
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

  this.rateOfTurn = 0.07;   /* Radians per tick that the ship will turn */
  this.rateOfAccel = 0.08;  /* Pixels per tick per tick that the spaceship accelerates */
  this.turningLeft = false;
  this.turningRight = false;
  this.accelerating = false;
  this.firing = false;
  this.gun = new Gun();
  this.size = 40;
}

Player.prototype = {

  update: function(timeScale, width, height) {

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

    this.gun.update(timeScale, width, height);
  },

  draw : function(){

    /*
     * Draw the triangle that makes up the body of the space ship. Let's say facing 0 is pointing straight up
     * In that case, our spaceship looks like this:
     *
     *            * Point 1
     *           / \
     *          / ^ \
     * Point 3 *-----* Point 2
     *          \   /
     *           \ /
     *            * Point 4
     *
     * Each point has an X and Y value. The XY values of the spaceship itself will be in the center of the triangle (the ^ symbol in the graphic )
     * Point 4 is used to make the rocket flame at the back of the ship if the ship is accelerating.
     */

    /* Point 1 is the nose of the spaceship */
    var point1 = {
      x: this.x,                   /* Point 1 uses the same x value as the spaceship center */
      y: this.y - this.size/2 /* Point 1 is half the spaceship size above the center point. */
    }

    /* Point 2 is the right wing of the spaceship */
    var point2 = {
      x: this.x + this.size/2, /* Point 2 is half the spaceship size to the right of the center point */
      y: this.y + this.size/2  /* Point 2 is half the spaceship size below the center point */
    }

    /* Point 3 is the left wing of the spaceship */
    var point3 = {
      x: this.x - this.size/2, /* Point 3 is half the spaceship size to the left of the center point */
      y: this.y + this.size/2  /* Point 3 is half the spaceship size below the center point */
    }

    /* Point 4 is the tip of the rocket flame  */
    var point4 = {
      x: this.x,                    /* Point 4 uses the same x value as the spaceship center */
      y: this.y + this.size    /* Point 4 is a full spaceship size below the center point */
    }

    /* Now turn all these points to face where the spaceship is facing */
    point1 = getRotatedPoint(point1, this, this.facing);
    point2 = getRotatedPoint(point2, this, this.facing);
    point3 = getRotatedPoint(point3, this, this.facing);
    point4 = getRotatedPoint(point4, this, this.facing);

    /* Now draw the spaceship using points 1,2,3 */
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.lineTo(point3.x, point3.y);
    ctx.closePath();
    ctx.fillStyle = "blue";
    ctx.fill();

    /* If the user is accelerating, draw the flame using points 2,3,4 */
    if (this.accelerating) {
      ctx.beginPath();
      ctx.moveTo(point2.x, point2.y);
      ctx.lineTo(point3.x, point3.y);
      ctx.lineTo(point4.x, point4.y);
      ctx.closePath();
      ctx.fillStyle = "orange";
      ctx.fill();
    }

    this.gun.draw();
  }
}

if (typeof module != "undefined") {
  module.exports = Player;
}