/* Create the values for our screen width and height */
var width = 800;
var height = 600;

/* Grab the canvas element with the id "screen" and set the width and height for it */
var container = document.getElementById("container");
var canvas = document.getElementById("screen");
canvas.width = width;
canvas.height = height;

/* Get a "context" from the canvas. This is an object that has drawing functions in it */
var ctx = canvas.getContext("2d");

let backgroundSlides = [];
for (let i =0; i < 20; i++) {

  let filename = "images/";
  let indexStr = (i+1).toFixed(0);

  for (let j =0; j < 4-indexStr.length;j++) {
    filename += "0";
  }

  filename += indexStr + ".png";
  backgroundSlides[i] = new Image();
  backgroundSlides[i].src = filename;
  backgroundSlides[i].style.display = "none";
  container.appendChild(backgroundSlides[i]);
}
container.appendChild(canvas);

let backgroundSlideIndex = 0;
let backgroundImage = backgroundSlides[backgroundSlideIndex];
setInterval(function(){
  backgroundImage.style.display = "none";
  backgroundSlideIndex++;
  if (backgroundSlideIndex >= backgroundSlides.length) {
    backgroundSlideIndex = 0;
  }
  backgroundImage = backgroundSlides[backgroundSlideIndex];
  backgroundImage.style.display = "inline";

},300);