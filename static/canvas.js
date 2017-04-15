/**
 * Created by Erick Fernando Cobo on 4/11/2017.
 */

var animate = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };

var canvas = document.createElement('canvas');
var width = window.innerWidth -100;
var height = window.innerHeight - 100;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');

var player1 = new Player1();
var player2 = new Player2();
var ball = new Ball(width / 2, height / 2);

var keysDown = {};

var render = function () {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    player1.render();
    player2.render();
    ball.render();
};

var update = function () {
    player1.update();
    player2.update(ball);
    ball.update(player1.paddle, player2.paddle);
};

var step = function () {
    update();
    render();
    animate(step);
};

function Paddle(y, x, width, height) {
    this.y = y;
    this.x = x;
    this.height = height;
    this.width = width;
    this.xspeed = 0;
    this.yspeed = 0;
}

Paddle.prototype.render = function () {
    context.fillStyle = "#ffffff";
    context.fillRect(this.x, this.y, this.height, this.width);
};

Paddle.prototype.move = function (y, x) {
    this.y += y;
    this.x += x;
    this.yspeed = y;
    this.xspeed = x;
    if (this.y < 0) {
        this.y = 0;
        this.yspeed = 0;
    } else if (this.y + this.width > width) {
        this.y = width - this.width;
        this.yspeed = 0;
    }
};

function Player2() {
    this.paddle = new Paddle((height / 2), width - 10, 200, 10);
}

Player2.prototype.render = function () {
    this.paddle.render();
};

Player2.prototype.update = function (ball) {
    var ypos = ball.y;
    var diff = -((this.paddle.y + (this.paddle.width / 2)) - ypos);
    if (diff < 0 && diff < -4) {
        diff = -20;
    } else if (diff > 0 && diff > 4) {
        diff = 20;
    }
    this.paddle.move(diff, 0);
    if (this.paddle.y < 0) {
        this.paddle.y = 0;
    } else if (this.paddle.y + this.paddle.width > width) {
        this.paddle.y = width - this.paddle.width;
    }
};

function Player1() {
    /* *************************************************************
     * params(y, x, width, height) for the Paddle
     *
     * Tomamos el heigth del canvas, lo divido entre dos (mitad)
     * y le resto la mitad del heigth del paddle, para que queden
     * concentricos los dos objetos.
     * *************************************************************
     */
    this.paddle = new Paddle((height / 2), 1, 200, 10);
}

Player1.prototype.render = function () {
    this.paddle.render();
};

Player1.prototype.update = function () {
    for (var key in keysDown) {
        var value = Number(key);
        if (value === 38) {
            this.paddle.move(-10, 0);
        } else if (value === 40) {
            this.paddle.move(10, 0)
        }
        else {
            this.paddle.move(0, 0);
        }
    }
};

function Ball(y, x) {
    this.y = y;
    this.x = x;
    this.yspeed = 10; // Esta linea de codigo nos sirve para cambiarle la velocidad a la pelota.
    this.xspeed = 0;
}

Ball.prototype.render = function () {
    context.beginPath();
    context.arc(this.y, this.x, 5, 2 * Math.PI, false);
    context.fillStyle = "#ffffff";
    context.fill();
};

Ball.prototype.update = function(paddle1, paddle2) {
  this.x += this.xspeed;
  this.y += this.yspeed;
  var top_x = this.x - 5;
  var top_y = this.y - 5;
  var bottom_x = this.x + 5;
  var bottom_y = this.y + 5;

  if(this.x - 5 < 0) { // hitting the left wall
    this.x = 5;
    this.xspeed = -this.xspeed;
  } else if(this.x + 5 > width) { // hitting the right wall
    this.x = width - 5;
    this.xspeed = -this.xspeed;
  }

  if(this.y < 0 || this.y > height) { // a point was scored
    this.xspeed = 0;
    this.yspeed = 3;
    this.x = width/2;
    this.y = height/2;
  }

  if(top_y > height/2) {
    if(top_y < (paddle1.y + paddle1.height) && bottom_y > paddle1.y && top_x < (paddle1.x + paddle1.width) && bottom_x > paddle1.x) {
      // hit the player's paddle
      this.yspeed = -3;
      this.xspeed += (paddle1.xspeed / 2);
      this.y += this.yspeed;
    }
  } else {
    if(top_y < (paddle2.y + paddle2.height) && bottom_y > paddle2.y && top_x < (paddle2.x + paddle2.width) && bottom_x > paddle2.x) {
      // hit the computer's paddle
      this.yspeed = 3;
      this.xspeed += (paddle2.xspeed / 2);
      this.y += this.yspeed;
    }
  }
};

window.onload = function () {
    document.getElementById('game-container').appendChild(canvas);
    animate(step);
};

window.addEventListener("keydown", function (event) {
    keysDown[event.keyCode] = true;
});

window.addEventListener("keyup", function (event) {
    delete keysDown[event.keyCode];
});
