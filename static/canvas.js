/**
 * Created by Erick Fernando Cobo on 4/12/2017.
 */
var animate = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };

var canvas = document.createElement('canvas');
var width = 1500;
var height = 750;
canvas.width = width;
canvas.height = height;
canvas.border = 1;
canvas.borderColor= 'white';
var context = canvas.getContext('2d');

window.onload = function () {
    document.getElementById('game-container').appendChild(canvas);
    animate(step);
};

var step = function() {
  update();
  render();
  animate(step);
};

var update = function() {
};

var render = function() {
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
};