let protocol = require("./binaryProtocol.js");
let assert = require("assert");
let Body = require("./body.js");
let {Bullet, Gun} = require("./gun.js");
let Player = require("./player.js");

describe("Test Float16", function(){
  let testVals = [-10, 0, 1.1, 1.3, 10];
  for (let testVal of testVals) {
    it(`Tests value ${testVal}`, function(){
      let range = [-10, 10];
      let encodedVal = protocol.encodeFloat16(testVal, range);
      let decodedVal = protocol.decodeFloat16(encodedVal, range);
      let expectedResolution = protocol.INV_NUM_FLOAT16_VALS * (range[1] - range[0]);
      assert(Math.abs(testVal - decodedVal) <= expectedResolution);
    });
  }
});

describe("Test Body", function() {
  it("encodes and decodes", function(){
    let serverCopy = new Body();
    serverCopy.x = 100;
    serverCopy.y = 101;
    serverCopy.speedX = 19.3;
    serverCopy.speedY = 3.4;
    serverCopy.facing = -123.4;
    let buffer = new ArrayBuffer(256);
    let bytesWritten = protocol.encodeBody(serverCopy, buffer, 0);
    assert(bytesWritten < buffer.byteLength);

    let clientCopy = new Body();
    let bytesRead = protocol.decodeBody(clientCopy, buffer, 0);
    assert.equal(serverCopy.x, clientCopy.x);
    assert.equal(serverCopy.y, clientCopy.y);
    assert(Math.abs(serverCopy.speedX - clientCopy.speedX) <= .003);
    assert(Math.abs(serverCopy.speedY - clientCopy.speedY) <= .003);
    assert(Math.abs(Math.sin(serverCopy.facing) - Math.sin(clientCopy.facing)) <= .003);

    assert.equal(bytesWritten, bytesRead);
  });
});

describe("Test Bullet", function() {
  it("encodes and decodes", function(){
    let serverCopy = new Bullet();

    serverCopy.x = 100;
    serverCopy.y = 101;
    serverCopy.speedX = 3.3;
    serverCopy.speedY = 3.4;
    serverCopy.facing = -123.4;
    serverCopy.t = 1.2;
    serverCopy.Vz0 = 3.1;

    let buffer = new ArrayBuffer(256);
    let bytesWritten = protocol.encodeBullet(serverCopy, buffer, 0);
    assert(bytesWritten < buffer.byteLength);

    let clientCopy = new Body();
    let bytesRead = protocol.decodeBullet(clientCopy, buffer, 0);
    assert.equal(serverCopy.x, clientCopy.x);
    assert.equal(serverCopy.y, clientCopy.y);
    assert(Math.abs(serverCopy.speedX - clientCopy.speedX) <= .003);
    assert(Math.abs(serverCopy.speedY - clientCopy.speedY) <= .003);
    assert(Math.abs(Math.sin(serverCopy.facing) - Math.sin(clientCopy.facing)) <= .003);
    assert(Math.abs(serverCopy.t - clientCopy.t) <= .003);
    assert(Math.abs(serverCopy.Vz0 - clientCopy.Vz0) <= .003);

    assert.equal(bytesWritten, bytesRead);
  });
});

describe("Test Player", function() {
  it("encodes and decodes", function() {
    let serverCopy = new Player();
    serverCopy.x = 100;
    serverCopy.y = 101;
    serverCopy.speedX = 3.3;
    serverCopy.speedY = 3.4;
    serverCopy.facing = -123.4;
    serverCopy.turningLeft = true;
    serverCopy.turningRight = true;
    serverCopy.accelerating = true;
    serverCopy.gun.firing = true;

    let buffer = new ArrayBuffer(256);
    let bytesWritten = protocol.encodePlayer(serverCopy, buffer, 0);
    assert(bytesWritten < buffer.byteLength);

    let clientCopy = new Player();
    let bytesRead = protocol.decodePlayer(clientCopy, buffer, 0);
    assert.equal(serverCopy.x, clientCopy.x);
    assert.equal(serverCopy.y, clientCopy.y);
    assert(Math.abs(serverCopy.speedX - clientCopy.speedX) <= .003);
    assert(Math.abs(serverCopy.speedY - clientCopy.speedY) <= .003);
    assert(Math.abs(Math.sin(serverCopy.facing) - Math.sin(clientCopy.facing)) <= .003);
    assert.equal(clientCopy.turningLeft, serverCopy.turningLeft);
    assert.equal(clientCopy.turningRight, serverCopy.turningRight);
    assert.equal(clientCopy.accelerating, serverCopy.accelerating);
    assert.equal(clientCopy.gun.firing, serverCopy.gun.firing);

    assert.equal(bytesWritten, bytesRead);
  });
});

describe("Test Message", function() {

  it("encodes and decodes", function() {
    let serverPlayers = {};
    let clientPlayers = {};

    for (let i =0; i < 4; i++) {
      serverPlayers[i] = new Player();
      serverPlayers[i].name = i;
      serverPlayers[i].x = 100;
      serverPlayers[i].y = 101;
      serverPlayers[i].speedX = 3.3;
      serverPlayers[i].speedY = 3.4;
      serverPlayers[i].facing = -123.4;
      serverPlayers[i].turningLeft = true;
      serverPlayers[i].turningRight = true;
      serverPlayers[i].accelerating = true;
      serverPlayers[i].gun.firing = true;
      serverPlayers[i].gun.firingPower = true;
      serverPlayers[i].gun.fire(serverPlayers[i]);
      serverPlayers[i].gun.fire(serverPlayers[i]);
      serverPlayers[i].gun.fire(serverPlayers[i]);
    }

    let buffer = new ArrayBuffer(512);
    let bytesWritten = protocol.encodeMessage(protocol.ACTION_UPDATE, serverPlayers, buffer);
    assert(bytesWritten < buffer.byteLength);
    let bytesRead = protocol.decodeMessage(clientPlayers, buffer, ()=>{});

    for (let i =0; i < 4; i++) {
      let serverCopy = serverPlayers[i];
      let clientCopy = clientPlayers[i];
      assert.equal(serverCopy.x, clientCopy.x);
      assert.equal(serverCopy.y, clientCopy.y);
      assert(Math.abs(serverCopy.speedX - clientCopy.speedX) <= .003);
      assert(Math.abs(serverCopy.speedY - clientCopy.speedY) <= .003);
      assert(Math.abs(Math.sin(serverCopy.facing) - Math.sin(clientCopy.facing)) <= .003);
      assert.equal(clientCopy.turningLeft, serverCopy.turningLeft);
      assert.equal(clientCopy.turningRight, serverCopy.turningRight);
      assert.equal(clientCopy.accelerating, serverCopy.accelerating);
      assert.equal(clientCopy.gun.firing, serverCopy.gun.firing);
    }

    assert.equal(bytesWritten, bytesRead);
  });
});

describe("Test Client Message" , function(){
  it("encodes and decodes ", function(){
    let serverCopy = new Player();
    serverCopy.gun.firingPower = serverCopy.gun.maxPower;

    let b = new Buffer(6);
    let buffer = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    let bytesWritten = protocol.encodeClientMessage(serverCopy, buffer);

    assert(bytesWritten <= buffer.byteLength);

    let clientCopy = new Player();
    let bytesRead = protocol.decodeClientMessage(clientCopy, buffer);
    assert.equal(bytesRead, bytesWritten);
    assert.equal(serverCopy.gun.firingPower, clientCopy.gun.firingPower)

  })

});