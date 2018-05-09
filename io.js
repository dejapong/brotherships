var players = {};
var myself = new Player();

let ws = new WebSocket("ws://192.168.1.5:8001");
// let ws = new WebSocket("ws://localhost:8001");

ws.onmessage = function(msg) {

  let obj = JSON.parse(msg.data);

  if (obj.action === "update") {
    for (let name in obj.players) {
      let player = players[name]
      if (player) {
        decode(obj.players[name], player);
      }
    }
  } else if (obj.action === "newPlayer") {

    let player = new Player(obj.name);
    players[player.name] = player;

  } else if (obj.action === "initialize") {

    myself.name = obj.name;
    myself.x = obj.x;
    myself.y = obj.y;
    players[myself.name] = myself;

    for (let name in obj.others) {
      players[name] = new Player(name);
      let other = obj.others[name];
      decode(players[name], other);
    }

  } else if (obj.action === "removePlayer") {
    delete players[obj.name];
  }
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

  /* Draw a black rectangle from the top left corner to fill the width and height of the canvas */
  ctx.fillStyle = "#000099";
  ctx.fillRect(0, 0, width, height);

  for (let playerName in players) {
    players[playerName].draw();
    players[playerName].update(timeScale, width, height);
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
  } else if (e.keyCode == 39) {
    /* 39 is the keyCode for right arrow */
    myself.turningRight = true;
  } else if (e.keyCode == 32 && !(e.repeat)) {
    /* 32 is the keyCode for space */
    myself.firing = true;
  } else {
    handled = false;
  }

  if (handled) {
    ws.send(JSON.stringify({
      action:"update",
      name: myself.name,
      accelerating: myself.accelerating,
      turningLeft: myself.turningLeft,
      turningRight: myself.turningRight,
    }));
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
  } else if (e.keyCode == 39) {
    /* 39 is the keyCode for right arrow */
    myself.turningRight = false;
  } else if (e.keyCode == 32) {
    /* 32 is the keyCode for space */
    myself.firing = false;
  } else {
    handled = false;
  }

  if (handled) {
    ws.send(JSON.stringify({
      action:"update",
      name: myself.name,
      accelerating: myself.accelerating,
      turningLeft: myself.turningLeft,
      turningRight: myself.turningRight,
    }));
  }
}

/* Set up the function to get called whenever a key is pressed down */
window.addEventListener("keydown", handleKeyDown);

/* Set up the function to get called whenever a key is released */
window.addEventListener("keyup", handleKeyUp);