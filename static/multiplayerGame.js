var socket = io.connect('http://' + document.domain + ':' + location.port);
function joinRoom() {
    socket.emit('join');
    $('#botones-salas').hide();
    $('#iniciar').show();
    $('#salir').show();
    $('#chat').show();
}

socket.on('join', function (text) {
    var elTextoComoJSON = JSON.parse(text);
    sessionStorage.setItem('room', elTextoComoJSON['room']);
    var laSalaActual = sessionStorage.getItem('room');
    var elJugadorActual = sessionStorage.getItem('player');
    if (elJugadorActual === null && laSalaActual !== null) {
        if (elTextoComoJSON['player'] === '1') {
            sessionStorage.setItem('player', '1');
        } else if (elTextoComoJSON['player'] === '2') {
            sessionStorage.setItem('player', '2');
        }
    } else if (elJugadorActual === '2') {
        if (elTextoComoJSON['player'] === '1') {
            sessionStorage.setItem('player', '1');
        }
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

socket.on('kick', function () {
    leaveRoom();
    alert("El otro jugador ha abandonado la partida.")
});


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

var step = function () { // variable STEP
    update();
    render();
    animate(step);
};

var player1 = new Player1(); // Nuevo jugador
var player2 = new Player2(); // Nueva IA
var line = new GameLine(0, width / 2, 3, height);
var score1 = new GameScoreP1(30, 50);
var score2 = new GameScoreP2(445, 50);
var ball = new Ball(width / 2, height / 2);
var p1Score = 0;
var p2Score = 0;

var render = function () { // variable RENDER
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    player1.render();
    player2.render();
    line.render();
    score1.render(p1Score);
    score2.render(p2Score);
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

GameScoreP1.prototype.render = function (p1Score) {
    context.font = "50px Monospace";
    context.fillStyle = "#FFFFFF";
    context.fillText("Player 1: " + p1Score, this.x, this.y);
};

function GameScoreP2(x, y) {
    this.x = x;
    this.y = y;
}

GameScoreP2.prototype.render = function (p2Score) {
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
            } else if (value === 83) { // S
                socket.emit('keypress', {key: 83, player: 1, room: sessionStorage.getItem('room')});
            } else {
                this.paddle.move(0, 0);
            }
        }
    }
};
/* ************************* PLAYER ENDS *********************** */


/* *********************** PLAYER BEGINS *********************** */

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
            } else if (value === 83) { // DOWN
                socket.emit('keypress', {key: 83, player: 2, room: sessionStorage.getItem('room')});
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
    this.top_x = 0;
    this.top_y = 0;
    this.bottom_x = 0;
    this.bottom_y = 0;
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
    if (sessionStorage.getItem('room') !== null) {
        this.x += this.velx;
        this.y += this.vely;
        this.top_x = this.x - 10;
        this.top_y = this.y - 10;
        this.bottom_x = this.x + 10;
        this.bottom_y = this.y + 10;
        this.p1 = p1;
        this.p2 = p2;
    }
    if (sessionStorage.getItem('player') !== null) {

        if (this.y - 10 < 0) {
            socket.emit('ballmove', {
                'y': 10,
                'x': this.x + this.velx,
                'vely': -this.vely,
                'room': sessionStorage.getItem('room')
            });
        } else if (this.y + 10 > height) {
            socket.emit('ballmove', {
                'y': height - 10,
                'x': this.x + this.velx,
                'vely': -this.vely,
                'room': sessionStorage.getItem('room')
            });
        }

        if (this.x < 0 || this.x > width) { // a point was scored
            if (ball.x < 0) {
                p2Score++;
            } else if (ball.x > width) {
                p1Score++;
            }
            socket.emit('ballmove', {
                'velx': 10,
                'vely': 0,
                'x': width / 2,
                'y': height / 2,
                'room': sessionStorage.getItem('room')
            })
        }

        if (this.bottom_x < width / 2) {
            if (this.top_y < (this.p1.y + this.p1.height) && this.bottom_y > this.p1.y && this.top_x < (this.p1.x + this.p1.width) && this.bottom_x > this.p1.x) {
                // hit the player1's paddle;
                socket.emit('ballmove', {
                    'velx': 10,
                    'vely': this.vely + (this.p1.vely / 2),
                    'y': this.y + this.vely,
                    'x': this.x,
                    'room': sessionStorage.getItem('room')
                })
            }
        } else {
            if (this.top_y < (this.p2.y + this.p2.height) && this.bottom_y > this.p2.y && this.top_x < (this.p2.x + this.p2.width) && this.bottom_x > this.p2.x) {
                // hit the player2's paddle
                socket.emit('ballmove', {
                    'velx': -10,
                    'vely': this.vely + (this.p2.vely / 2),
                    'y': this.y + this.vely,
                    'x': this.x,
                    'room': sessionStorage.getItem('room')
                })
            }
        }
    }
};

socket.on('ballmove', function (text) {
    elTextoComoJSON = JSON.parse(text);
    if (ball.y - 10 < 0) {
        ball.y = elTextoComoJSON['y'];
        ball.x = elTextoComoJSON['x'];
        ball.vely = elTextoComoJSON['vely'];
    } else if (ball.y + 10 > height) {
        ball.y = elTextoComoJSON['y'];
        ball.x = elTextoComoJSON['x'];
        ball.vely = elTextoComoJSON['vely'];
    }

    if (ball.x < 0 || ball.x > width) {
        // a point was scored
        // if (ball.x < 0){
        //     p2Score++;
        //     score2.render(p2Score);
        // } else if (ball.x > width){
        //     p1Score++;
        //     score1.render(p1Score);
        // }
        ball.velx = elTextoComoJSON['velx'];
        ball.vely = elTextoComoJSON['vely'];
        ball.x = elTextoComoJSON['x'];
        ball.y = elTextoComoJSON['y'];

    }

    if (ball.bottom_x < width / 2) {
        if (ball.top_y < (ball.p1.y + ball.p1.height) && ball.bottom_y > ball.p1.y && ball.top_x < (ball.p1.x + ball.p1.width) && ball.bottom_x > ball.p1.x) {
            ball.vely = elTextoComoJSON['vely'];
            ball.velx = elTextoComoJSON['velx'];
            ball.y = elTextoComoJSON['y'];
            ball.x = elTextoComoJSON['x']
        }
    }
    else {
        if (ball.top_y < (ball.p2.y + ball.p2.height) && ball.bottom_y > ball.p2.y && ball.top_x < (ball.p2.x + ball.p2.width) && ball.bottom_x > ball.p2.x) {
            ball.vely = elTextoComoJSON['vely'];
            ball.velx = elTextoComoJSON['velx'];
            ball.y = elTextoComoJSON['y'];
            ball.x = elTextoComoJSON['x']
        }
    }
});
/* ************************** BALL ENDS ************************ */
