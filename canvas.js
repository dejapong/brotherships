/* Create the values for our screen width and height */
var width = 800;
var height = 600;

/* Grab the canvas element with the id "screen" and set the width and height for it */
var canvas = document.getElementById("screen");
canvas.width = width;
canvas.height = height;

/* Get a "context" from the canvas. This is an object that has drawing functions in it */
var ctx = canvas.getContext("2d");