const G = 2. // gravity constant
const bulletScale = .03;
const bulletMin = 3;
const lightAngle = 45 * Math.PI * 180;

if (typeof Body == "undefined") {
  var Body = require("./body.js");
}

function Bullet() {
  Body.call(this);
  this.drag = 0.001
  this.alive = false;
}

Bullet.prototype = Object.assign(Object.create(Body.prototype), {

  reset : function(x, y, facing, hSpeed, vSpeed) {
    this.alive = true;
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.speed = hSpeed;
    this.Vz0 = vSpeed;
    this.t = 0;
  },

  update : function(timeScale, width, height) {
    Body.prototype.update.call(this, timeScale, width, height);

    this.t += timeScale;
    this.z = this.Vz0 * this.t - .5 *  1 * this.t * this.t;
    if (this.z <= 0) {
      this.alive = false;
    }
  },

  draw : function() {
    let radius = bulletMin + this.z * bulletScale;

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(
      this.x + this.z * Math.cos(lightAngle),
      this.y + this.z * Math.sin(lightAngle),
      radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

});

function Gun() {
  this.maxBullets = 10;
  this.bullets = [];
  this.facing = 0 ;
  this.x =0;
  this.y =0;

  this.muzzleVelocity = 20;
  this.inclination = 45 * Math.PI / 180;

  for (let i =0 ; i < this.maxBullets; i++) {
    this.bullets.push(new Bullet());
  }
}

Gun.prototype = {

  fire: function(player) {
    //find a dead bullet
    let bullet;

    for (let testBullet of this.bullets) {
      if (!testBullet.alive) {
        bullet = testBullet;
        break;
      }
    }

    if (bullet) {
      bullet.reset(
        player.x + this.x,
        player.y + this.y,
        player.facing + this.facing,
        player.speed + this.muzzleVelocity * Math.cos(this.inclination),
        this.muzzleVelocity * Math.sin(this.inclination));
    }
  },

  update : function(timeScale, width, height) {
    for (let bullet of this.bullets) {
      if (bullet.alive) {
        bullet.update(timeScale, width, height);
      }
    }
  },

  draw: function() {
    for (let bullet of this.bullets) {
      if (bullet.alive) {
        bullet.draw();
      }
    }
  }

}

if (typeof module !== "undefined") {
  module.exports = Gun;
}