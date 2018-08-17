var players = {};
var myself = new Player();

let ws = new WebSocket("ws://localhost:8001");

ws.binaryType = 'arraybuffer';

function checkBulletSplash(){
  // let the server do this
};

var onIdentified = function(player) {
  // Dont do anything for now
}

sendMyState = function() {

  /* Update client copy for state calculation */
  myself.clientUpdate();

  for (let i = 0; i < myself.guns.length; i++) {
    let gun = myself.guns[i];
    if (gun.startFiring) {
      let powerLevel = height * (gun.firingPower / gun.maxPower);
      powerBarLevels[i].style.height = `${powerLevel}px`;
    } else {
      powerBarLevels[i].style.height = `0px`;
    }
  }

  let sentFiring = [myself.guns[0].firing, myself.guns[1].firing];
  let byteArray = new ArrayBuffer(6);
  encodeClientMessage(myself, byteArray)

  ws.send(byteArray);

  for (let i =0; i < myself.guns.length; i++) {
    myself.guns[i].firing = false;
  }

}

ws.onmessage = function(msg) {
  var data = msg.data;
  let bytesRead = decodeMessage(players, data, onIdentified);
  sendMyState();
}

ws.onopen = function() {
  console.log("Connected");
}

let lastTime = 0;
const updateRateMs = 50;

var render = function(){
  let nowMs = performance.now();
  let timeScale = 1;
  let elapsedMs = (nowMs - lastTime);

  if (lastTime != 0) {
    timeScale = elapsedMs / (updateRateMs);
  }

  lastTime = nowMs;

  ctx.clearRect(0, 0, width,height);

  for (let playerName in players) {
    let player = players[ playerName ];
    player.draw();
    player.update(timeScale, width, height);
  }

  requestAnimationFrame(render);
};

render();

/* This function will listen to key down events, and update the myself object */
function handleKeyDown(e) {
  let handled = true;
  if (e.keyCode == 37) {
    /* 37 is the keyCode for left arrow */
    myself.turningLeft = true;
  } else if (e.keyCode == 38) {
    /* 38 is the keyCode for up arrow */
    myself.accelerating = true;
  } else if (e.keyCode == 40) {
    /* 40 is the keyCode for down arrow */
  } else if (e.keyCode == 39) {
    /* 39 is the keyCode for right arrow */
    myself.turningRight = true;
  } else if (e.keyCode == 83) {
    if (!e.repeat) {
      myself.guns[1].startFiring = performance.now();
    }
  } else if (e.keyCode == 65) {
    if (!e.repeat) {
      myself.guns[0].startFiring = performance.now();
    }
  } else if (e.keyCode == 32) {
  } else {
    handled = false;
  }

  if (handled) {
    e.preventDefault();
  }

}

/* This function will listen to key up events, and update the myself object */
function handleKeyUp(e) {

  let handled = true;

  if (e.keyCode == 37) {
    /* 37 is the keyCode for left arrow */
    myself.turningLeft = false;
  } else if (e.keyCode == 38) {
    /* 38 is the keyCode for up arrow */
    myself.accelerating = false;
  } else if (e.keyCode == 40) {
    /* 40 is the keyCode for down arrow */
  } else if (e.keyCode == 39) {
    /* 39 is the keyCode for right arrow */
    myself.turningRight = false;
  } else if (e.keyCode == 83) {
    if (myself.guns[1].startFiring) {
      myself.guns[1].firing = true;
      myself.guns[1].startFiring = 0;
    }
  } else if (e.keyCode == 65) {
    if (myself.guns[0].startFiring) {
      myself.guns[0].firing = true;
      myself.guns[0].startFiring = 0;
    }
  } else if (e.keyCode == 32) {

  } else {
    handled = false;
  }

  if (handled) {
    e.preventDefault();
  }
}

/* Set up the function to get called whenever a key is pressed down */
window.addEventListener("keydown", handleKeyDown);

/* Set up the function to get called whenever a key is released */
window.addEventListener("keyup", handleKeyUp);
