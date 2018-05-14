var players = {};
var myself = new Player();

let ws = new WebSocket("ws://192.168.1.3:8001");
// let ws = new WebSocket("ws://localhost:8001");
ws.binaryType = 'arraybuffer';

function checkBulletSplash(){
  // let the server do this
};

sendMyState = function() {
  let byteArray = new Uint8Array(1);
  byteArray.set([encodeBitFlags(myself)], 0);
  ws.send(byteArray.buffer);
}

ws.onmessage = function(msg) {

  var data = msg.data;
  let bytesRead = decodeMessage(players, data);
  sendMyState();
  myself.firing = false;

}

ws.onopen = function() {
  console.log("Connected to server!");
}

let lastTime = 0;
const updateRateMs = 50;


render = function(){

  let nowMs = performance.now();
  let timeScale = 1;
  let elapsedMs = (nowMs - lastTime);

  if (lastTime != 0) {
    timeScale = elapsedMs / (updateRateMs);
  }

  lastTime = nowMs;

  ctx.clearRect(0, 0, width,height);

  for (let playerName in players) {
    let player = players[playerName];
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
  } else if (e.keyCode == 32) {
    /* 32 is the keyCode for space */
    if (!e.repeat) {
      myself.firing = true;
    }
  } else {
    handled = false;
  }

  if (handled) {
    // sendMyState();
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
  } else if (e.keyCode == 32) {
    /* 32 is the keyCode for space */
    // myself.firing = false;
  } else {
    handled = false;
  }

  if (handled) {
    // sendMyState();
    e.preventDefault();
  }
}

/* Set up the function to get called whenever a key is pressed down */
window.addEventListener("keydown", handleKeyDown);

/* Set up the function to get called whenever a key is released */
window.addEventListener("keyup", handleKeyUp);
