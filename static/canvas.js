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
var width = window.innerWidth - 400;
var height = window.innerHeight - 300;
canvas.width = width;
canvas.height = height;
canvas.border = 1;
canvas.borderColor = 'white';
var context = canvas.getContext('2d');

window.onload = function () {
    document.getElementById('game-container').appendChild(canvas);
    animate(step);
};

var update = function () {
    ball.update(player.paddle, computer.paddle)
};

var player = new Player();
var computer = new Computer();
var ball = new Ball((width / 2), (height / 2));

var render = function () {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    player.render();
    computer.render();
    ball.render();
    ball.update(player.paddle, computer.paddle);
};

var step = function () {
    update();
    render();
    animate(step);
};

function Paddle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.x_speed = 0;
    this.y_speed = 0;
}

Paddle.prototype.render = function () {
    context.fillStyle = "#FFFFFF";
    context.fillRect(this.x, this.y, this.width, this.height);
};

function Player() {
    this.paddle = new Paddle(width - (width - 20), ((height / 2) - 50), 20, 100);
}

function Computer() {
    this.paddle = new Paddle(width - 40, height / 2 - 50, 20, 100);
}

Player.prototype.render = function () {
    this.paddle.render();
};

Computer.prototype.render = function () {
    this.paddle.render();
};

function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.x_speed = -3;
    this.y_speed = 0;
    this.radius = 10;
}

Ball.prototype.render = function () {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
    context.fillStyle = "#FFFFFF";
    context.fill();
};

Ball.prototype.update = function (paddle1, paddle2) {
    this.x += this.x_speed;
    this.y += this.y_speed;
    var top_x = this.y + 20;
    var top_y = this.x + 20;
    var bottom_x = this.y - 20;
    var bottom_y = this.x - 20;

    if (this.x - 50 < 0) { // hitting the left wall
        this.x = 50;
        this.x_speed = -this.x_speed;
    } else if (this.x + 50 > width) { // hitting the right wall
        this.x = width - 50;
        this.y_speed = -this.y_speed;
    }

    if (this.y < 0 || this.y > height) { // a point was scored
        this.x_speed = 0;
        this.y_speed = 3;
        this.x = height / 2;
        this.y = width / 2;
    }

    if (top_y > height/2) {
        if (top_y < (paddle1.y + paddle1.height) && bottom_y > paddle1.y && top_x < (paddle1.x + paddle1.width) && bottom_x > paddle1.x) {
            // hit the player's paddle
            this.y_speed = 3;
            this.x_speed += (paddle1.x_speed / 2);
            this.y += this.y_speed;
        }
    } else {
        if (top_y < (paddle2.x + paddle2.height) && bottom_y > paddle2.x && top_x < (paddle2.y + paddle2.width) && bottom_x > paddle2.y) {
            // hit the computer's paddle
            this.y_speed = -3;
            this.x_speed += (paddle2.x_speed / 2);
            this.y += this.y_speed;
        }
    }
};


