function Body(){
  this.x = 0;      /* X (horizontal) location of our spaceship in pixels from the left side of the screen. Start it in the middle. (half the width) */
  this.y = 0;     /* Y (vertical) location of our spaceship in pixels from the top of the screen. Start it in the middle. (half the height) */
  this.facing = 0;         /* Angle that the spaceship is facing */
  this.maxSpeed = 100;
  this.speed = 0;
  this.speedX = 0.0;       /* Current speed of the ship in the X direction in pixels per tick */
  this.speedY = 0.0;       /* Current speed of the ship in the Y direction in pixels per tick */
  this.drag = 0.01;
  this.alive = true;
}

Body.prototype = {

  update : function(timeScale, width, height) {

    if (this.accelerating) {
      this.speed += this.rateOfAccel * timeScale;
    } else {
      this.speed -= (this.drag + this.drag * this.speed * this.speed) * timeScale;
    }

    this.speed = Math.max(0, this.speed);
    this.speed = Math.min(this.maxSpeed, this.speed);
    this.speedX = this.speed * Math.sin(this.facing);
    this.speedY = -this.speed * Math.cos(this.facing);

    this.x += this.speedX * timeScale;
    this.y += this.speedY * timeScale;

    if (this.x < 0){
      this.x = 1;
      this.facing = Math.atan2(-this.speedX, -this.speedY);
    }

    if (this.x > width){
      this.x = width - 1;
      this.facing = Math.atan2(-this.speedX, -this.speedY);
    }

    if (this.y < 0){
      this.y = 1;
      this.facing = Math.atan2(this.speedX, this.speedY);
    }

    if (this.y > height) {
      this.y = height - 1;
      this.facing = Math.atan2(this.speedX, this.speedY);
    }
  }
}

if (typeof module != "undefined") {
  module.exports = Body;
}
