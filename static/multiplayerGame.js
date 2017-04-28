/* ****************************************************************************************
 *
 * MULTIPLAYER
 *
 * EN ESTE JS BASICAMENTE LO QUE SE HACE ES AGREGAR LA LOGICA DEL JUEGO, CREAR LAS CONEXIONES
 * CON LOS SOCKETS, Y EL MANEJO DE EVENTOS EN EL CASO DE QUE EL USUARIO PRESIONE UNA TECLA
 * CUANDO ESTE DENTRO DE UN JUEGO. A CONTINUACION SE VA A IR COMENTANDO CADA LINEA, PARA
 * IR EXPLICANNDO MAS A FONDO COMO FUNCIONA EL JUEGO Y ESTE SCRIPT EN GENERAL.
 *
 * **************************************************************************************** */

/* ****************************************************************************************
 *
 * AQUI SE INICIALIZA EL SOCKET DE CONEXION AL SERVIDOR.
 *
 * *************************************************************************************** */

var socket = io.connect('http://' + document.domain + ':' + location.port);

/* ****************************************************************************************
 *
 * AQUI LO QUE SE HACE ES QUE SE MANEJA LA CONEXION CUANDO UNA PERSONA SE UNE A ALGUNO DE
 * LOS ROOMS QUE ESTAN EN EL JUEGO, BASICAMENTE LOS 'ROOMS' SON LOS MODOS DE JUEGO.
 *
 * HAY 3 TIPOS DE JUEGO, 2/3, 3/5 Y 4/7 EN LOS CUALES SE NECESITA GANAR 2 VECES, 3 VECES O
 * 4 VECES RESPECTIVAMENTE PARA PODER GANAR.
 *
 * *************************************************************************************** */
function joinRoom() {
    if (sessionStorage.getItem('gameMode') === '2/3') {
        socket.emit('join-2/3');
    } else if (sessionStorage.getItem('gameMode') === '3/5') {
        socket.emit('join-3/5');
    } else if (sessionStorage.getItem('gameMode') === '4/7') {
        socket.emit('join-4/7');
    }
    $('#botones-salas').hide();
    $('#iniciar').show();
    $('#salir').show();
    $('#chat').show();
}

/* ****************************************************************************************
 *
 * AQUI LO QUE SE HACE ES QUE SE MANEJA CUANDO UNA PERSONA SE CONECTA AL JUEGO POR MEDIO DEL
 * CLIENTE. A COMO VAN ENTRANDO LOS DOS JUGADORES, ASIGNA CUAL VA A SER EL JUGADOR 1, QUE ES
 * EL HOST DE LA PARTIDA, Y EL JUGADOR 2, QUE ES EL QUE VA A ESTAR ESCUCHANDO TODO LO QUE EL
 * HOST LE VAYA DICIENDO QUE RENDERICE EN EL CANVAS.
 *
 * BASICAMENTE EL PLAYER 1 SIEMPRE VA A TOMAR EL TIMON DE HOST, Y EL SEGUNDO ES COMO LA TERMINAL
 * TONTA QUE ESCUCHA Y ACTUALIZA SEGUN LO QUE LE DIGA EL HOST(PLAYER 1).
 *
 * *************************************************************************************** */
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

/* ****************************************************************************************
 *
 * ESTO LO QUE HACE ES QUE EMITE UN MENSAJE QUE SE INGRESE EN LA VENTANA DEL CHAT EN ALGUNO
 * DE LOS 3 MODOS DE JUEGOS QUE EXISTEN DENTRO DEL MULTIPLAYER.
 *
 * *************************************************************************************** */
function enviarTexto() {
    texto = $('#texto').val();
    socket.emit('message', {message: texto, room: sessionStorage.getItem('room')});
    texto.val("");
}

/* ****************************************************************************************
 *
 * ESTO LO QUE HACE ES CUANDO RECIBE EL MENSAJE, LE HACE APPEND A LA LISTA DE MENSAJES, Y
 * RENDERIZA DE LOS DOS LADOS, PARA QUE LOS DOS JUGADORES SE PUEDAN COMUNICAR.
 *
 * *************************************************************************************** */
socket.on('message', function (message) {
    document.getElementById('chat-box').innerHTML += message + '<br>';
});

/* ****************************************************************************************
 *
 * CUANDO UN JUGADOR SE VA DEL ROOM, BASICAMENTE SE REMUEVE DEL SESSION STORAGE EL PLAYER Y
 * EL ROOM QUE TENIA ASIGNADO ESE SID DEL SOCKET QUE ESTA CONECTADO.
 *
 * *************************************************************************************** */
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

/* ****************************************************************************************
 *
 * CUANDO ALGUNO DE LOS DOS JUGADORES SE SALE DE LA PARTIDA, EL SERVIDOR INSTANTANEAMENTE
 * ECHA AL OTRO JUGADOR, PARA QUE NO SE QUEDE DENTRO DE LA PARTIDA, YA QUE PARA QUE INICIE
 * SE NECESITAN LOS DOS JUGADORES.
 *
 * *************************************************************************************** */
socket.on('kick', function () {
    leaveRoom();
    alert("El otro jugador ha abandonado la partida.")
});


/* ****************************************************************************************
 *
 * AQUI LO QUE SE HACE ES QUE SE LLAMAN A LOS FRAMES DE LAS ANIMACIONES QUE SE VAN A UTILIZAR
 * DENTRO DEL JUEGO.
 *
 * *************************************************************************************** */
/* ********************* CANVAS SETUP BEGINS ********************* */
var animate = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };

/* ****************************************************************************************
 *
 * AQUI SE CREA EL CANVAS QUE SE VA A UTILIZAR PARA EL JUEGO. POR DEFAULT, ESTA SETTEADO A
 * UNA ALTURA DE 600 Y UN ANCHO DE 800.
 *
 * *************************************************************************************** */
var canvas = document.createElement('canvas');
var width = 800;
var height = 600;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');

/* ****************************************************************************************
 *
 * AQUI SE INGRESA DENTRO DEL HTML EL NUEVO CANVAS QUE SE CREO EN EL CONTENEDOR DE JUEGO
 * QUE TIENE POR SI SOLO EL ID "GAME-CONTAINER". COMO EL CONTENEDOR ES UN DIV, ENTONCES
 * SE LE TIENE QUE HACER UN APPENDCHILD() YA QUE ESE CANVAS QUE SE CREA NO PUEDE SUSTITUIR
 * AL CONTENEDOR, ENTONCES SE INGRESA DENTRO DEL HTML DEL GAME-CONTAINER, DONDE SE VA A
 * DESPLEGAR EL CANVAS.
 *
 * *************************************************************************************** */
window.onload = function () {
    document.getElementById('game-container').appendChild(canvas);
    animate(step);
};

/* ****************************************************************************************
 *
 * AQUI LO QUE SE HACE ES QUE SE ESCUCHAN EVENTOS DEL JUGADOR 1 CUANDO LE HACE "RELEASE"
 * A LA TECLA.
 *
 * *************************************************************************************** */
window.addEventListener("keyup", function (event) {
    delete keysDownP1[event.keyCode];
});

/* ****************************************************************************************
 *
 * AQUI LO QUE SE HACE ES QUE SE ESCUCHAN EVENTOS DEL JUGADOR 1 CUANDO LE HACE "PRESS"
 * A LA TECLA.
 *
 * *************************************************************************************** */
window.addEventListener("keydown", function (event) {
    keysDownP1[event.keyCode] = true;
});

/* ****************************************************************************************
 *
 * AQUI LO QUE SE HACE ES QUE SE ESCUCHAN EVENTOS DEL JUGADOR 2 CUANDO LE HACE "RELEASE"
 * A LA TECLA.
 *
 * *************************************************************************************** */
window.addEventListener("keyup", function (event) {
    delete keysDownP2[event.keyCode];
});

/* ****************************************************************************************
 *
 * AQUI LO QUE SE HACE ES QUE SE ESCUCHAN EVENTOS DEL JUGADOR 2 CUANDO LE HACE "PRESS"
 * A LA TECLA.
 *
 * *************************************************************************************** */
window.addEventListener("keydown", function (event) {
    keysDownP2[event.keyCode] = true;
});

/* ****************************************************************************************
 *
 * ESTO SIRVE PARA QUE EL CANVAS EN EL HTML SE ESTE RENDERIZANDO CONSTANTEMENTE.
 *
 * *************************************************************************************** */
var step = function () { // variable STEP
    update();
    render();
    animate(step);
};

/* ****************************************************************************************
 *
 * TODOS ESTO SON LAS NUEVAS INSTANCIAS DE LOS JUGADORES, MARCADORES, LINEA DEL MEDIO, LA BOLA
 * Y SE INICIALIZAN LOS MARCADORES DE LOS DOS JUGADORES EN 0.
 *
 * *************************************************************************************** */
var setAmountP1 = 0;
var setAmountP2 = 0;
var player1 = new Player1(); // Nuevo jugador
var player2 = new Player2(); // Nueva IA
var line = new GameLine(0, width / 2, 3, height);
var score1 = new GameScoreP1(30, 50);
var score2 = new GameScoreP2(445, 50);
var ball = new Ball(width / 2, height / 2);
var p1Score = 0;
var p2Score = 0;

/* ****************************************************************************************
 *
 * ESTE METODO SE ENCARGA DE RENDERIZAR LAS DOS PALETAS DE LOS JUGADORES, LA BOLA, LA
 * LINEA DEL MEDIO DEL CAMPO, LOS DOS MARCADORES, ETC.
 *
 * *************************************************************************************** */
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

/* ****************************************************************************************
 *
 * SE ENCARGA DE ESTAR ACTUALIZANDO CONSTANTEMENTE LAS DOS PALETAS Y LA BOLA.
 *
 * *************************************************************************************** */
var update = function () { // variable UPDATE
    player1.update();
    player2.update(ball);
    ball.update(player1.paddle, player2.paddle);
};

/* ********************* CANVAS SETUP ENDS ********************* */


/* ****************************************************************************************
 *
 * ESTE ES LA CLASE BASE PARA PODER HACER LA LINEA QUE SE RENDERIZA EN MEDIO DEL CAMPO DEL
 * JUEGO DEL PONG. RECIBE 4 PARAMETROS.
 *
 * X ES LA POSICION EN X EN EL CANVAS.
 *
 * Y ES LA POSICION EN Y EN EL CANVAS
 *
 * WIDTH ES EL ANCHO DE LA LINEA
 *
 * HEIGHT ES LA ALTURA DE LA LINEA, QUE PARA TODOS LOS CASOS VA A SER SIEMPRE IGUAL AL HEIGHT
 * DEL CANVAS.
 *
 * *************************************************************************************** */
/* ********************* GAMELINE BEGINS *********************** */
function GameLine(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

/* ****************************************************************************************
 *
 * GAMELINE HEREDA POR MEDIO DE PROTOTYPE DE LA VARIABLE DE RENDER, PARA PODER UTILIZAR ESA
 * FUNCIONALIDAD Y PODER RENDERIZAR LA LINEA EN MEDIO DEL CAMPO, DE OTRA FORMA, SERIA CASI
 * QUE IMPOSIBLE.
 *
 * *************************************************************************************** */
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


/* ****************************************************************************************
 *
 * TIPO CONSTRUCTOR DEL MARCADOR DE PUNTOS DEL JUGADOR 1.
 *
 * *************************************************************************************** */
/* ********************* GAMESCORE BEGINS ********************** */
function GameScoreP1(x, y) {
    this.x = x;
    this.y = y;
}

/* ****************************************************************************************
 *
 * IGUALMENTE, HEREDA POR MEDIO DE PROTOTYPE LA FUNCIONALIDAD DE LA VARIABLE RENDER, PARA
 * PODER RENDERIZAR EL MARCADOR DENTRO DEL CANVAS ACTUAL.
 *
 * *************************************************************************************** */
GameScoreP1.prototype.render = function (p1Score) {
    context.font = "35px Monospace";
    context.fillStyle = "#FFFFFF";
    context.fillText("Player 1: " + p1Score, this.x, this.y);
};

/* ****************************************************************************************
 *
 * TIPO CONSTRUCTOR DEL MARCADOR DE PUNTOS DEL JUGADOR 2.
 *
 * *************************************************************************************** */
function GameScoreP2(x, y) {
    this.x = x;
    this.y = y;
}

/* ****************************************************************************************
 *
 * IGUALMENTE, HEREDA POR MEDIO DE PROTOTYPE LA FUNCIONALIDAD DE LA VARIABLE RENDER, PARA
 * PODER RENDERIZAR EL MARCADOR DENTRO DEL CANVAS ACTUAL.
 *
 * *************************************************************************************** */
GameScoreP2.prototype.render = function (p2Score) {
    context.font = "35px Monospace";
    context.fillStyle = "#FFFFFF";
    context.fillText("Player 2: " + p2Score, this.x, this.y);
};
/* ********************** GAMESCORE ENDS *********************** */


/* ************************ PADDLES BEGIN ********************** */
/* ****************************************************************************************
 *
 * TIPO CONSTRUCTOR DE LAS PALETAS QUE VAN A USAR LOS DOS JUGADORES.
 *
 * *************************************************************************************** */
function Paddle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velx = 0;
    this.vely = 0;
}


/* ****************************************************************************************
 *
 * PADDLE HEREDA, POR MEDIO DE PROTOTYPE, LAS FUNCIONALIDADES DE LA VARIABLE RENDER
 * COMO PADDLE TIENE LOS MISMO PARAMETROS QUE LOS ARGUMENTOS DE FILLRECT, ENTONCES
 * PODEMOS LLENARLOS CON LOS DATOS DEL CONSTRUCTOR DEL PADDLE.
 *
 * *************************************************************************************** */
Paddle.prototype.render = function () {
    context.fillStyle = '#fff';
    context.fillRect(this.x, this.y, this.width, this.height);
};

/* ****************************************************************************************
 *
 * SE ENCARGA DE MANEJAR LA PARTE DEL MOVIMIENTO DE LAS PALETAS DENTRO DEL CANVAS DEL JUEGO.
 * ESTA ES LA LOGICA QUE SE VA A IMPLEMENTAR EL LA FUNCION DE ACTUALIZAR LA PALETA.
 *
 * *************************************************************************************** */
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
/* ****************************************************************************************
 *
 * AQUI SE CREA UN NUEVO JUGADOR, QUE ES EL JUGADOR 1. SE CREA UNA NUEVA PALETA, QUE ES EL
 * JUGADOR.
 *
 * *************************************************************************************** */
function Player1() {
    // INTRODUCIMOS LOS ARGUMENTOS PARA PINTAR EL PADDLE QUE ES EL PLAYER.
    // ARGS = (X, Y, WEIGTH, HEIGHT)
    this.paddle = new Paddle(width - (width - 20), (height / 2) - 50, 20, 100);
}

// PLAYER HEREDA, POR MEDIO DE PROTOTYPE, LAS FUNCIONALIDADES DE LA VARIABLE RENDER.
/* ****************************************************************************************
 *
 * PLAYER1 HEREDA DE RENDER USANDO PROTOTYPE Y POR MEDIO DE ESTO, ADQUIERE LA FUNCIONALIDAD
 * DE RENDER PARA PODER MOSTRAR LA PALETA EN EL CANVAS.
 *
 * *************************************************************************************** */
Player1.prototype.render = function () {
    this.paddle.render();
};

/* ****************************************************************************************
 *
 * ESTA ES LA VARIABLE PARA GUARDAR LOS EVENTOS DE KEYUP O KEYDOWN DEL JUGADOR 1.
 *
 * *************************************************************************************** */
var keysDownP1 = [];

/* ****************************************************************************************
 *
 * PLAYER 1 HEREDA POR MEDIO DE PROTOTYPE LA FUNCIONALIDAD DE LA VARIABLE UPDATE, PARA PODER
 * ESTAR CONSTANTEMENTE ACTUALIZANDO LA UBICACION DE LA PALETA. AQUI SE IMPLEMENTA LA FUNCION
 * DE MOVE, LA CUAL LE PERMITE A LA PALETA MOVERSE UNA Y CANTIDAD DE PIXELES DENTRO DEL CANVAS.
 *
 * TAMBIEN, SE HACE MANEJO DE LAS TECLAS QUE EL CLIENTE PRESIONE. EN CASO DE SER 87 ES LA W,
 * QUE LE DICE A LA PALETA QUE SE MUEVA UNA X DETERMINADA CANTIDAD DE PIXELES.
 *
 * AQUI SOLO SE EMITEN LOS EVENTOS, PERO SON MANEJADOS CON EL SOCKET.ON() DE ABAJO.
 *
 * *************************************************************************************** */
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

// DECIMOS QUE PLAYER 2 ES UNA NUEVA INSTANCIA DE PADDLE
function Player2() {
    // Introducimos los argumentos para pintar el PADDLE que es el PLAYER.
    // Args = (x, y, weigth, height)
    this.paddle = new Paddle(width - 40, (height / 2) - 50, 20, 100);
}

// PLAYER HEREDA, POR MEDIO DE PROTOTYPE, LAS FUNCIONALIDADES DE LA VARIABLE RENDER.
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
/* ****************************************************************************************
 *
 * COMO BIEN SE MENCIONO ANTERIORMENTE, UNO DE LOS DOS JUGADORES ES EL HOST, Y POR MEDIO DE
 * LOS SOCKETS, EL SE ENCARGA DE EMITIR LA INFORMACION DE LAS PALETAS, LA BOLA Y DONDE ESTAN
 * UBICADAS ACTUALMENTE.
 *
 * *************************************************************************************** */
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
/* ****************************************************************************************
 *
 * TIPO CONSTRUCTOR DE LA BOLA, RECIBE DOS PARAMENTROS, LA X Y LA Y.
 *
 * X POSICION DE LA BOLA EN X DEL CANVAS.
 *
 * Y POSICION DE LA BOLA EN Y DEL CANVAS.
 *
 * *************************************************************************************** */
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

/* ****************************************************************************************
 *
 * LA BOLA, POR MEDIO DE PROTOTYPE, HEREDA DE LA VARIABLE RENDER, PARA ASI PODER RENDERIZAR
 * LA PELOTA EN EL CANVAS DEL JUEGO ACTUAL.
 *
 * *************************************************************************************** */
Ball.prototype.render = function () {
    context.beginPath(); // Para empezar a dibujar el circulo
    context.arc(this.x, this.y, this.radius, Math.PI * 2, 0); // arc necesita un x, y, r, angula_inicial, angulo_final
    context.fillStyle = "#FFFFFF";
    context.fill(); // se rellena la BALL para que sea visible en el canvas.
};

/* ****************************************************************************************
 *
 * EN ESTE METODO, SE MANEJA LA POSICION DE LA BOLA PARA LA DETECCION DE COLISIONES, VELOCIDAD
 * DE LA BOLA CUANDO TOCA DETERMINADA PALETA EN DETERMINADO ANGULO, ETC.
 *
 * ESTA PARTE SOLO SE DEDICA A EMITIR LOS DATOS DEL HOST HACIA EL SERVIDOR, Y DEL SERVIDOR
 * A LAS DOS PERSONAS EN EL SOCKET.
 *
 * *************************************************************************************** */
Ball.prototype.update = function (p1, p2) {
    // Ball speed
    // AQUI BASICAMENTE LE DECIS QUE SI EL SESSION STORAGE ESTA VACIO, QUE NO INICIE EL JUEGO.
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

/* ****************************************************************************************
 *
 * ESTA PARTE SE DEDICA A ACTUALIZAR LOS DATOS QUE SON EMITIDOS DE PARTE DEL CLIENTE HOST.
 *
 * *************************************************************************************** */
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
        var setAmount = 0;
        if (sessionStorage.getItem('gameMode') === '2/3') {
            setAmount = 2;
            if (p1Score > 9) {
                setAmountP1 += 1;
                p1Score = 0;
                p2Score = 0;
                if (setAmountP1 >= setAmount) {
                    alert("Player 1 won!!!!");
                    setAmountP1 = 0;
                }
            }
            else if (p2Score > 9) {
                setAmountP2 += 1;
                p1Score = 0;
                p2Score = 0;
                if (setAmountP2 >= setAmount) {
                    alert("Player 2 won!!");
                    setAmountP2 = 0;
                }
            }
            else {
                if (ball.x < 0) {
                    p2Score++;
                } else if (ball.x > width) {
                    p1Score++;
                }
            }
        }

        if (sessionStorage.getItem('gameMode') === '3/5') {
            setAmount = 3;
            if (p1Score > 9) {
                setAmountP1 += 1;
                p1Score = 0;
                p2Score = 0;
                if (setAmountP1 >= setAmount) {
                    alert("Player 1 won!!!!");
                    setAmountP1 = 0;
                }
            }
            else if (p2Score > 9) {
                setAmountP2 += 1;
                p1Score = 0;
                p2Score = 0;
                if (setAmountP2 >= setAmount) {
                    alert("Player 2 won!!");
                    setAmountP2 = 0;
                }
            }
            else {
                if (ball.x < 0) {
                    p2Score++;
                } else if (ball.x > width) {
                    p1Score++;
                }
            }
        }

        if (sessionStorage.getItem('gameMode') === '4/7') {
            setAmount = 4;
            if (p1Score > 9) {
                setAmountP1 += 1;
                p1Score = 0;
                p2Score = 0;
                if (setAmountP1 >= setAmount) {
                    alert("Player 1 won!!!");
                    setAmountP1 = 0;
                }
            }
            else if (p2Score > 9) {
                setAmountP2 += 1;
                p1Score = 0;
                p2Score = 0;
                if (setAmountP2 >= setAmount) {
                    alert("Player 2 won!");
                    setAmountP2 = 0;
                }
            }
            else {
                if (ball.x < 0) {
                    p2Score++;
                } else if (ball.x > width) {
                    p1Score++;
                }
            }
        }

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
            ball.x = elTextoComoJSON['x'];
        }
    }
});
/* ************************** BALL ENDS ************************ */
