/**
 * Created by Erick Fernando Cobo on 4/11/2017.
 */
/* ********************* CANVAS SETUP BEGINS ********************* */
/* ****************************************************************************************
 *
 * SOLOGAME
 *
 * EN ESTE JS BASICAMENTE LO QUE SE HACE ES AGREGAR LA LOGICA DEL JUEGO, EL MANEJO DE EVENTOS
 * EN EL CASO DE QUE EL USUARIO PRESIONE UNA TECLA CUANDO ESTE DENTRO DE UN JUEGO.
 * A CONTINUACION SE VA A IR COMENTANDO CADA LINEA, PARA IR EXPLICANNDO MAS A FONDO COMO FUNCIONA
 * EL JUEGO Y ESTE SCRIPT EN GENERAL.
 *
 * *************************************************************************************** */
var animate = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };

/* ****************************************************************************************
 *
 * A NIVEL GLOBAL CREAMOS ESTAS VARIABLES, PARA PODER SETTEAR LA CANTIDAD DE SETS QUE HA
 * GANADO EL JUGADOR O LA COMPUTADORA, ADEMAS DE LA CANTIDAD DE SETS QUE SE TIENEN QUE GANAR
 * PARA PODER SER VICTORIOSO EN EL CAMPOS DE BATALLA!!!!!!!!!
 *
 * *************************************************************************************** */
var setAmount = 2;
var setAmountP1 = 0;
var setAmountPC = 0;
var canvas = document.createElement('canvas');
var width = window.innerWidth - 150;
var height = window.innerHeight - 150;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');


/* ****************************************************************************************
 *
 * OBTIENE EL CONTENEDOR QUE VA A ALBERGAR EL JUEGO.
 *
 * *************************************************************************************** */
window.onload = function () {
    document.getElementById('game-container').appendChild(canvas);
    animate(step);
};


/* ****************************************************************************************
 *
 * ESCUCHA EVENTOS DEL JUGADOR, CUANDO PRESIONA UNA TECLA PARA EL EVENTO "RELEASE" DE LA TECLA.
 *
 * *************************************************************************************** */
window.addEventListener("keyup", function (event) {
    delete keysDown[event.keyCode];
});


/* ****************************************************************************************
 *
 * ESCUCHA EVENTOS DEL JUGADOR, CUANDO PRESIONA UNA TECLA PARA EL EVENTO "PRESS" DE LA TECLA.
 *
 * *************************************************************************************** */
window.addEventListener("keydown", function (event) {
    keysDown[event.keyCode] = true;
});


/* ****************************************************************************************
 *
 * SIRVE PARA INICIAR EL CANVAS.
 *
 * *************************************************************************************** */
var step = function () { // variable STEP
    update();
    render();
    animate(step);
};


/* ****************************************************************************************
 *
 * SE CREAN LAS INSTANCIAS DE LOS JUGADORES, DE LAS PALETAS, LA BOLA, LA LINEA DEL MEDIO DEL
 * CAMPO DE JUEGO, LOS DOS MARCADORES.
 *
 * *************************************************************************************** */
var keysDown = [];
var player = new Player(); // Nuevo jugador
var computer = new Computer(); // Nueva IA
var line = new GameLine(0, width / 2, 15, height);
var score1 = new GameScoreP1(50, 50);
var score2 = new GameScorePC((width / 2) + 50, 50);
var ball = new Ball(width / 2, height / 2);


/* ****************************************************************************************
 *
 * SE ENCARGA DE RENDERIZAR TODAS LAS INSTANCIAS DE LOS DISTINTOS OBJETOS DENTRO DEL CONTEXTO
 * DEL CANVAS.
 *
 * *************************************************************************************** */
var render = function () { // variable RENDER
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    player.render();
    computer.render();
    line.render();
    score1.render();
    score2.render();
    ball.render();
};


/* ****************************************************************************************
 *
 * SE ENCARGA DE ESTAR CONSTANTEMENTE ACTUALIZANDO LAS POSICIONES DE LOS OBJETOS DENTRO DEL
 * CONTEXTO DEL CANVAS.
 *
 * *************************************************************************************** */
var update = function () { // variable UPDATE
    player.update();
    computer.update(ball);
    ball.update(player.paddle, computer.paddle);
};

/* ********************* CANVAS SETUP ENDS ********************* */


/* ********************* GAMELINE BEGINS *********************** */

/* ****************************************************************************************
 *
 * TIPO CONSTRUCTOR DE LA LINEA QUE SE RENDERIZA EN EL MEDIO DE CAMPO DE BATALLA!!!!!
 *
 * *************************************************************************************** */
function GameLine(x, y) {
    this.x = x;
    this.y = y;
}


/* ****************************************************************************************
 *
 * SE ENCARGA DE CREAR LA LINEA EN EL MEDIO DEL CAMPO Y UBICARLA DONDE SE LE PIDE QUE ESTE.
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


/* ********************* GAMESCORE BEGINS ********************** */

/* ****************************************************************************************
 *
 * SIRVE PARA CREAR UN MARCADOR PARA EL JUGADOR 1.
 *
 * *************************************************************************************** */
function GameScoreP1(x, y) {
    this.x = x;
    this.y = y;
}


/* ****************************************************************************************
 *
 * SIRVE PARA RENDERIZAR EL MARCADOR DEL JUGADOR 1 DENTRO DEL CONTEXTO DEL CANVAS.
 *
 * HEREDA POR MEDIO DE PROTOTYPE LA FUNCIONALIDAD DE LA VARIABLE RENDER, PARA PODER MOSTRAR
 * ESTE OBJETO EN EL CONTEXTO DEL CANVAS.
 *
 * *************************************************************************************** */
GameScoreP1.prototype.render = function () {
    context.font = "35px Monospace";
    context.fillStyle = "#FFFFFF";
    context.fillText("Player 1: " + p1Score, this.x, this.y);
};


/* ****************************************************************************************
 *
 * SIRVE PARA CREAR UN MARCADOR PARA LA COMPUTADORA.
 *
 * *************************************************************************************** */
function GameScorePC(x, y) {
    this.x = x;
    this.y = y;
}


/* ****************************************************************************************
 *
 * SIRVE PARA RENDERIZAR EL MARCADOR PARA LA COMPUTADORA DENTRO DEL CONTEXTO DEL CANVAS.
 *
 * HEREDA POR MEDIO DE PROTOTYPE LA FUNCIONALIDAD DE LA VARIABLE RENDER, PARA PODER MOSTRAR
 * ESTE OBJETO EN EL CONTEXTO DEL CANVAS.
 *
 * *************************************************************************************** */
GameScorePC.prototype.render = function () {
    context.font = "35px Monospace";
    context.fillStyle = "#FFFFFF";
    context.fillText("Computer: " + pcScore, this.x, this.y);
};
/* ********************** GAMESCORE ENDS *********************** */


/* ************************ PADDLES BEGIN ********************** */
//
/* ****************************************************************************************
 *
 * ESTA ES COMO LA CLASE CONSTRUCTURA DE PADDLE
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
 * LOGICA PARA PODER MOVER LA PALETA DENTRO DEL CANVAS.
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
var p1Score = 0; // CONTADOR DEL SCORE DEL JUGADOR 1.

/* ****************************************************************************************
 *
 * DECIMOS QUE PLAYER ES UNA NUEVA INSTANCIA DE PADDLE
 *
 * *************************************************************************************** */
function Player() {
    // Introducimos los argumentos para pintar el PADDLE que es el PLAYER.
    // Args = (x, y, weigth, height)
    this.paddle = new Paddle(width - (width - 20), (height / 2) - 50, 20, 100);
}

/* ****************************************************************************************
 *
 * PLAYER HEREDA, POR MEDIO DE PROTOTYPE, LAS FUNCIONALIDADES DE LA VARIABLE RENDER.
 *
 * *************************************************************************************** */
Player.prototype.render = function () {
    this.paddle.render();
};

Player.prototype.update = function () {
    var movement = 20;
    for (var key in keysDown) {
        var value = Number(key);
        if (value === 87) { // left arrow
            this.paddle.move(0, -movement);
        } else if (value === 83) { // right arrow
            this.paddle.move(0, movement);
        } else {
            this.paddle.move(0, 0);
        }
    }
};
/* ************************* PLAYER ENDS *********************** */


/* *********************** COMPUTER BEGINS ********************* */

var pcScore = 0;
// Decimos que PLAYER es una nueva instancia de PADDLE
function Computer() {
    // Introducimos los argumentos para pintar el PADDLE que es el PLAYER.
    // Args = (x, y, weigth, height)
    this.paddle = new Paddle(width - 40, (height / 2) - 50, 20, 100);
}


/* ****************************************************************************************
 *
 * COMPUTER HEREDA, POR MEDIO DE PROTOTYPE, LAS FUNCIONALIDADES DE LA VARIABLE RENDER.
 *
 * *************************************************************************************** */
Computer.prototype.render = function () {
    this.paddle.render();
};

/* ****************************************************************************************
 *
 * SE ENCARGA DE MOVER LA PALETA DE LA COMPUTADORA DENTRO DEL CANVAS, SE ENFOCA EN PERSEGUIR
 * EL CENTRO DE LA BOLA, PARA PODER ANOTAR PUNTOS EN CONTRA DEL JUGADOR 1. ESTO BASICAMENTE
 * ES UN TIPO DE INTELIGENCIA ARTIFICIAL.
 *
 * CUENTA CON UNA VELOCIDAD DE MOVIMIENTO, QUE ES "MOVEMENT"
 *
 * *************************************************************************************** */
Computer.prototype.update = function (ball) {
    var movement = 12;
    var ypos = ball.y;
    var advance = -((this.paddle.y + (this.paddle.height / 2)) - ypos);
    if (advance < 0 && advance < -movement) {
        advance = -movement;
    } else if (advance > 0 && advance > movement) {
        advance = movement;
    }
    this.paddle.move(0, advance);
    if (this.paddle.y < 0) {
        this.paddle.y = 0;
    } else if (this.paddle.y + this.paddle.height > height) {
        this.paddle.y = height - this.paddle.height;
    }
};
/* ************************ COMPUTER ENDS ********************** */


/* ************************* BALL BEGINS *********************** */
// Decimos que PLAYER es una nueva instancia de PADDLE

/* ****************************************************************************************
 *
 * TIPO DE CONSTRUCTOR PARA LA BOLA.
 *
 * RECIBE X Y Y
 *
 * X PARA LLEVAR UN RECORD DE SU POSICION EN X
 *
 * Y PARA LLEVAR UN RECORD DE SU POSICION EN Y
 *
 * *************************************************************************************** */
function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.velx = -15;
    this.vely = 0;
    this.radius = 10;
}

/* ****************************************************************************************
 *
 * BALL HEREDA, POR MEDIO DE PROTOTYPE, LAS FUNCIONALIDADES DE LA VARIABLE RENDER.
 *
 * *************************************************************************************** */
Ball.prototype.render = function () {
    context.beginPath(); // Para empezar a dibujar el circulo
    context.arc(this.x, this.y, this.radius, Math.PI * 2, 0); // arc necesita un x, y, r, angula_inicial, angulo_final
    context.fillStyle = "#fff";
    context.fill(); // se rellena la BALL para que sea visible en el canvas.
};


/* ****************************************************************************************
 *
 * EN ESTE METODO BASICAMENTE DE UTILIZA LA FUNCIONALIDAD DE LA VARIABLE UPDATE, PARA PODER
 * ACTUALIZAR LA POSICION DE LA BOLA EN EL CANVAS. TAMBIEN, ESTE METODO SE ENCARGA DE ADMINISTRAR
 * LA DETECCION DE COLISIONES CON LAS PAREDES DEL CANVAS PARA ASI DECIRLE A LA BOLA QUE DIRECCION
 * DEBE DE TOMAR SI PEGA EN X O Y PARTE DE LA PALETA DEL JUGADOR 1 O DE LA COMPUTADORA.
 *
 * *************************************************************************************** */
Ball.prototype.update = function (p1, pc) {
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

    if (this.x < 0 || this.x > width) {
        if (p1Score > 9) {
            setAmountP1 += 1;
            p1Score = 0;
            pcScore = 0;
            if (setAmountP1 >= setAmount) {
                alert("Player won!!!");
                setAmountP1 = 0;
            }
        }
        else if (pcScore > 9) {
            setAmountPC += 1;
            p1Score = 0;
            pcScore = 0;
            if (setAmountPC >= setAmount) {
                alert("Computer won!");
                setAmountPC = 0;
            }
        }
        else {
            if (this.x < 0) {
                pcScore++;
            } else if (ball.x > width) {
                p1Score++;
            }
        }
        this.velx = 10;
        this.vely = 0;
        this.x = width / 2;
        this.y = height / 2;
    }


    if (bottom_x < width / 2) {
        if (top_y < (p1.y + p1.height) && bottom_y > p1.y && top_x < (p1.x + p1.width) && bottom_x > p1.x) {
            this.vely += (p1.vely / 2);
            this.velx = 10;
            this.y += this.vely;
        }
    } else {
        if (top_y < (pc.y + pc.height) && bottom_y > pc.y && top_x < (pc.x + pc.width) && bottom_x > pc.x) {
            this.vely += (pc.vely / 2);
            this.velx = -10;
            this.y += this.vely;
        }

    }
};
/* ************************** BALL ENDS ************************ */