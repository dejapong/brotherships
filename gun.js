const G = 2. // gravity constant
const bulletScale = .03;
const bulletMin = 3;
const lightAngle = 45 * Math.PI * 180;

if (typeof require != "undefined") {
  var collision = require("./collision.js");
  var Body = require("./body.js");
}

function Bullet(gun) {
  Body.call(this);
  this.drag = 0.001
  this.alive = false;
  this.gun = gun;
}

Bullet.prototype = Object.assign(Object.create(Body.prototype), {

  reset : function(x, y, facing, hSpeed, vSpeed) {
    this.alive = true;
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.speed = hSpeed;
    this.Vz0 = vSpeed;
    this.U0 = 0;
    this.t = 0;
    this.z = 0;
  },

  update : function(timeScale, width, height) {
    Body.prototype.update.call(this, timeScale, width, height);
    // console.log(this.x,this.y, this.speed)
    this.t += timeScale;
    this.z = this.Vz0 * this.t - .5 *  1 * this.t * this.t;
    if (this.z < 0) {
      this.alive = false;
      this.gun.livingBullets--;
      if (collision){
        collision.checkBulletSplash(this.x, this.y);
      }
    }
  },

  draw : function() {
    let radius = Math.max(bulletMin, bulletMin + this.z * bulletScale);

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(
      this.x + this.z * Math.cos(lightAngle),
      this.y + this.z * Math.sin(lightAngle),
      radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = this.gun.player.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

});

function Gun(player) {
  this.maxBullets = 3;
  this.bullets = [];
  this.facing = 0 ;
  this.livingBullets = 0;
  this.x =0;
  this.y =0;
  this.player = player;
  this.muzzleVelocity = 20;
  this.inclination = 45 * Math.PI / 180;
  this.maxHoldDown = 1000;
  this.maxPower = 20;
  this.minPower = 8;
  for (let i =0; i < this.maxBullets; i++) {
    this.bullets.push(new Bullet(this));
  }
}

Gun.prototype = {

  fire: function() {

    //find a dead bullet
    let bullet;
    for (let testBullet of this.bullets) {
      if (!testBullet.alive) {
        bullet = testBullet;
        let power = Math.max(this.minPower, Math.min(this.maxPower, this.firingPower));
        bullet.reset(
          this.player.x + this.x + 20 * (Math.random() - 0.5),
          this.player.y + this.y + 20 * (Math.random() - 0.5),
          this.player.facing + this.facing + 0.2 * (Math.random() - 0.5),
          this.player.speed + power * Math.cos(this.inclination) + 3 * (Math.random() - 0.5),
                              power * Math.sin(this.inclination) + 3 * (Math.random() - 0.5));
        this.livingBullets++;
      }
    }

    this.firing = false;
  },

  clientUpdate : function() {
    if (this.startFiring) {
      let elapsed = (performance.now() - this.startFiring);
      this.firingPower = this.maxPower * (elapsed / this.maxHoldDown);

      if (this.firingPower >= this.maxPower) {
        this.firingPower = this.maxPower;
        this.firing = true;
        this.startFiring = 0;
      }
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
  module.exports = {
    Gun: Gun,
    Bullet: Bullet
  }
}