/**
 * Created by Erick Fernando Cobo on 4/11/2017.
 */

/* ********************* CANVAS SETUP BEGINS ********************* */
var animate = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };

var canvas = document.createElement('canvas');
var width = 800;
var height = 600;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');

window.onload = function () {
    document.getElementById('game-container').appendChild(canvas);
    animate(step);
};

var step = function () { // variable STEP
    update();
    render();
    animate(step);
};

var player = new Player(); // Nuevo jugador
var computer = new Computer(); // Nueva IA
var ball = new Ball(width / 2, height / 2);
var render = function () { // variable RENDER
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    player.render();
    computer.render();
    ball.render();
};

var update = function () { // variable UPDATE
    ball.update(player.paddle, computer.paddle);
};

/* ********************* CANVAS SETUP ENDS ********************* */

/* ************************************************************* */

/* ************************ PADDLES BEGIN ********************** */
// Esta es como la clase constructura de PADDLE
function Paddle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velx = 0;
    this.vely = 0;
}

// PADDLE hereda, por medio de prototype, las funcionalidades de la variable RENDER
/* Como PADDLE tiene los mismo parametros que los argumentos de fillRect, entonces
 * podemos llenarlos con los datos del constructor del PADDLE.
 */
Paddle.prototype.render = function () {
    context.fillStyle = '#fff';
    context.fillRect(this.x, this.y, this.width, this.height);
};
/* ************************* PADDLES END *********************** */

/* ************************************************************* */

/* ************************ PLAYER BEGINS ********************** */
// Decimos que PLAYER es una nueva instancia de PADDLE
function Player() {
    // Introducimos los argumentos para pintar el PADDLE que es el PLAYER.
    // Args = (x, y, weigth, height)
    this.paddle = new Paddle(width - (width - 20), (height / 2) - 100, 20, 200);
}

// PLAYER hereda, por medio de prototype, las funcionalidades de la variable RENDER.
Player.prototype.render = function () {
    this.paddle.render();
};
/* ************************* PLAYER ENDS *********************** */

/* ************************************************************* */

/* *********************** COMPUTER BEGINS ********************* */
// Decimos que PLAYER es una nueva instancia de PADDLE
function Computer() {
    // Introducimos los argumentos para pintar el PADDLE que es el PLAYER.
    // Args = (x, y, weigth, height)
    this.paddle = new Paddle(width - 40, (height / 2) - 100, 20, 200);
}

// PLAYER hereda, por medio de prototype, las funcionalidades de la variable RENDER.
Computer.prototype.render = function () {
    this.paddle.render();
};
/* ************************ COMPUTER ENDS ********************** */

/* ************************************************************* */

/* ************************* BALL BEGINS *********************** */
// Decimos que PLAYER es una nueva instancia de PADDLE
function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.velx = -5;
    this.vely = 0;
    this.radius = 10;
}

// PLAYER hereda, por medio de prototype, las funcionalidades de la variable RENDER.
Ball.prototype.render = function () {
    context.beginPath(); // Para empezar a dibujar el circulo
    context.arc(this.x, this.y, this.radius, Math.PI * 2, 0); // arc necesita un x, y, r, angula_inicial, angulo_final
    context.fillStyle = "#fff";
    context.fill(); // se rellena la BALL para que sea visible en el canvas.
};

Ball.prototype.update = function (p1, pc) {
    this.x += this.velx;
    this.y += this.vely;
    var topy = this.y + 10;
    var boty = this.y - 10;
    var leftx = this.x + 10;
    var rightx = this.x - 10;


};
/* ************************** BALL ENDS ************************ */