var socket = io.connect('http://' + document.domain + ':' + location.port);

function joinRoom() {
    socket.emit('join', {room: sessionStorage.getItem('room')});
    $('#botones-salas').hide();
    $('#iniciar').show();
    $('#salir').show();
    $('#chat').show();
}

socket.on('join', function (text) {
    if (text === '1') {
        sessionStorage.setItem('player', '1');
        alert(sessionStorage.getItem('player'));

    } else if (text === '2') {
        sessionStorage.setItem('player', '2');
        alert(sessionStorage.getItem('player'));

    }

    if (text !== 'full') {
        alert("Hay campo.")
    } else {
        alert("Esta sala se encuentra llena. Por favor elija otra.")
    }
});

function enviarTexto() {
    texto = $('#texto').val();
    socket.emit('message', {message: texto, room: sessionStorage.getItem('room')});
    texto.val("");
}

socket.on('message', function (message) {
    document.getElementById('chat-box').innerHTML += message + '<br>';
});

function leaveRoom() {
    socket.emit('leave', {room: sessionStorage.getItem('room')});
    sessionStorage.removeItem('room');
    sessionStorage.removeItem('player');
    document.getElementById('chat-box').innerHTML = "";
    $('#botones-salas').show();
    $('#iniciar').hide();
    $('#salir').hide();
    $('#chat').hide();
}

/* ********************* CANVAS SETUP BEGINS ********************* */
var animate = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };

var canvas = document.createElement('canvas');
var width = window.innerWidth - 150;
var height = window.innerHeight - 150;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');

window.onload = function () {
    document.getElementById('game-container').appendChild(canvas);
    animate(step);
};

window.addEventListener("keyup", function (event) {
    delete keysDownP1[event.keyCode];
});

window.addEventListener("keydown", function (event) {
    keysDownP1[event.keyCode] = true;
});

window.addEventListener("keyup", function (event) {
    delete keysDownP2[event.keyCode];
});

window.addEventListener("keydown", function (event) {
    keysDownP2[event.keyCode] = true;
});

var number_for_score = [
    '111101101101111', // 0
    '010010010010010', // 1
    '111001111100111', // 2
    '111001111001111', // 3
    '101101111001001', // 4
    '111100111001111', // 5
    '111100111101111', // 6
    '111001001001001', // 7
    '111101111101111', // 8
    '111101111001001'  // 9
];

var step = function () { // variable STEP
    update();
    render();
    animate(step);
};

var player1 = new Player1(); // Nuevo jugador
var player2 = new Player2(); // Nueva IA
var line = new GameLine(0, width / 2, 15, height);
var score1 = new GameScoreP1(width / 2 - 600, 50);
var score2 = new GameScoreP2(width - 600, 50);
var ball = new Ball(width / 2, height / 2);

var render = function () { // variable RENDER
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    player1.render();
    player2.render();
    line.render();
    score1.render();
    score2.render();
    ball.render();
};

var update = function () { // variable UPDATE
    player1.update();
    player2.update(ball);
    ball.update(player1.paddle, player2.paddle);
};

/* ********************* CANVAS SETUP ENDS ********************* */


/* ********************* GAMELINE BEGINS *********************** */
function GameLine(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

GameLine.prototype.render = function () {
    context.beginPath();
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2, height);
    context.strokeStyle = "#FFFFFF";
    context.lineWidth = this.width;
    context.stroke();
    context.closePath();
};
/* ********************** GAMELINE ENDS ************************ */


/* ********************* GAMESCORE BEGINS ********************** */
function GameScoreP1(x, y) {
    this.x = x;
    this.y = y;
}

GameScoreP1.prototype.render = function () {
    context.font = "50px Monospace";
    context.fillStyle = "#FFFFFF";
    context.fillText("Player 1: " + p1Score, this.x, this.y);
};

function GameScoreP2(x, y) {
    this.x = x;
    this.y = y;
}

GameScoreP2.prototype.render = function () {
    context.font = "50px Monospace";
    context.fillStyle = "#FFFFFF";
    context.fillText("Player 2: " + p2Score, this.x, this.y);
};
/* ********************** GAMESCORE ENDS *********************** */


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

Paddle.prototype.move = function (x, y) {
    this.x += x;
    this.y += y;
    this.velx = x;
    this.vely = y;
    if (this.y < 0) { // all the way to the left
        this.y = 0;
        this.vely = 0;
    } else if (this.y + this.height > height) { // all the way to the right
        this.y = height - this.height;
        this.vely = 0;
    }
};
/* ************************* PADDLES END *********************** */


/* ************************ PLAYER BEGINS ********************** */
var p1Score = 0;
// Decimos que PLAYER es una nueva instancia de PADDLE
function Player1() {
    // Introducimos los argumentos para pintar el PADDLE que es el PLAYER.
    // Args = (x, y, weigth, height)
    this.paddle = new Paddle(width - (width - 20), (height / 2) - 50, 20, 100);
}

// PLAYER hereda, por medio de prototype, las funcionalidades de la variable RENDER.
Player1.prototype.render = function () {
    this.paddle.render();
};

var keysDownP1 = [];

Player1.prototype.update = function () {
    if (sessionStorage.getItem('player') === '1') {
        for (var key in keysDownP1) {
            var value = Number(key);
            if (value === 87) { // W
                socket.emit('keypress', {key: 87, player: 1, room: sessionStorage.getItem('room')});
                //this.paddle.move(0, -15);
            } else if (value === 83) { // S
                socket.emit('keypress', {key: 83, player: 1, room: sessionStorage.getItem('room')});
                //this.paddle.move(0, 15);
            } else {
                this.paddle.move(0, 0);
            }
        }
    }
};
/* ************************* PLAYER ENDS *********************** */


/* *********************** PLAYER BEGINS *********************** */
var p2Score = 0;
// Decimos que PLAYER es una nueva instancia de PADDLE
function Player2() {
    // Introducimos los argumentos para pintar el PADDLE que es el PLAYER.
    // Args = (x, y, weigth, height)
    this.paddle = new Paddle(width - 40, (height / 2) - 50, 20, 100);
}

// PLAYER hereda, por medio de prototype, las funcionalidades de la variable RENDER.
Player2.prototype.render = function () {
    this.paddle.render();
};
var keysDownP2 = [];

Player2.prototype.update = function () {
    if (sessionStorage.getItem('player') === '2') {
        for (var key in keysDownP2) {
            var value = Number(key);
            if (value === 87) { // UP
                socket.emit('keypress', {key: 87, player: 2, room: sessionStorage.getItem('room')});
                //this.paddle.move(0, -15);
            } else if (value === 83) { // DOWN
                socket.emit('keypress', {key: 83, player: 2, room: sessionStorage.getItem('room')});
                //this.paddle.move(0, 15);
            } else {
                this.paddle.move(0, 0);
            }
        }
    }
};
/* ************************ PLAYER ENDS ************************ */

/* ************************ SOCKET BEGINS ************************ */

socket.on('keypress', function (keypress) {
    var keypressJSON = JSON.parse(keypress);
    if (keypressJSON['key'] === 87) {
        if (keypressJSON['player'] === 1) {
            player1.paddle.move(0, -15);
        }
        else if (keypressJSON['player'] === 2) {
            player2.paddle.move(0, -15)
        }
    } else if (keypressJSON['key'] === 83) {
        if (keypressJSON['player'] === 1) {
            player1.paddle.move(0, 15)
        }
        else if (keypressJSON['player'] === 2) {
            player2.paddle.move(0, 15)
        }
    }
});

/* ************************ SOCKET ENDS ************************ */


/* ************************* BALL BEGINS *********************** */
// Decimos que PLAYER es una nueva instancia de PADDLE
function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.velx = -10;
    this.vely = 0;
    this.radius = 10;
}

// PLAYER hereda, por medio de prototype, las funcionalidades de la variable RENDER.
Ball.prototype.render = function () {
    context.beginPath(); // Para empezar a dibujar el circulo
    context.arc(this.x, this.y, this.radius, Math.PI * 2, 0); // arc necesita un x, y, r, angula_inicial, angulo_final
    context.fillStyle = "#FFFFFF";
    context.fill(); // se rellena la BALL para que sea visible en el canvas.
};

Ball.prototype.update = function (p1, p2) {
    // Ball speed
    this.x += this.velx;
    this.y += this.vely;
    var top_x = this.x - 10;
    var top_y = this.y - 10;
    var bottom_x = this.x + 10;
    var bottom_y = this.y + 10;

    if (this.y - 10 < 0) {
        this.y = 10;
        this.vely = -this.vely;
    } else if (this.y + 10 > height) {
        this.y = height - 10;
        this.vely = -this.vely;
    }

    if (this.x < 0 || this.x > width) { // a point was scored
        this.velx = 10;
        this.vely = 0;
        this.x = width / 2;
        this.y = height / 2;
    }

    if (bottom_x < width / 2) {
        if (top_y < (p1.y + p1.height) && bottom_y > p1.y && top_x < (p1.x + p1.width) && bottom_x > p1.x) {
            // hit the player1's paddle
            this.vely += (p1.vely / 2);
            this.velx = 10;
            this.y += this.vely;
        }
    } else {
        if (top_y < (p2.y + p2.height) && bottom_y > p2.y && top_x < (p2.x + p2.width) && bottom_x > p2.x) {
            // hit the player2's paddle
            this.vely += (p2.vely / 2);
            this.velx = -10;
            this.y += this.vely;
        }
    }
};
/* ************************** BALL ENDS ************************ */
