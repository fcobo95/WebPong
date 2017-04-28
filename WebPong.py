# SECCION PARA IMPORTAR MODULOS NECESARIOS
from flask import Flask, render_template, request, json, Response, jsonify, redirect
from pymongo import MongoClient
from bson import ObjectId
from flask_httpauth import HTTPBasicAuth
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from flask_socketio import SocketIO, join_room, leave_room
import datetime
import base64

# SE CREA LA APLICACION DE FLASK, SE DEFINE LA LLAVE SECRETA PARA LA CREACION DE TOKENS,
# SE INICIALIZA LA AUTENTICACION BASICA, Y EL USO DE SOCKETS.
app = Flask(__name__)
app.config['SECRET_KEY'] = 'JE9395ccce'
auth = HTTPBasicAuth()
socketio = SocketIO(app)

# ESTA FUNCION CORRE UNA VEZ AL INICIAR EL SERVIDOR, EN DONDE CREA LA CONEXION CON LA BASE
# DE DATOS LOCAL, ASI COMO LAS LISTAS PARA LAS COLAS Y LAS SALAS DE JUEGO DISPONIBLES.
with app.app_context():
    clienteLocal = MongoClient('localhost', 27017)
    localDatabase = clienteLocal.MongoLocal
    laColaModo23 = []
    laColaModo35 = []
    laColaModo47 = []
    lasSalas23 = ['A', 'B', 'C', 'D', 'E']
    lasSalas35 = ['F', 'G', 'H', 'I', 'J']
    lasSalas47 = ['K', 'L', 'M', 'N', 'O']


# ESTE METODO VERIFICA QUE EL USUARIO SEA VALIDO, AL RECIBIR DOS PARAMETROS. PRIMERO REVISA SI
# LO QUE RECIBE ES UN TOKEN Y SI ES VALIDO, SI NO ES ASI, BUSCA EL USUARIO EN LA BASE DE DATOS
# Y VERIFICA SI EL USUARIO Y LA CONTRASENA COINCIDEN CON LOS REGISTROS.
@auth.verify_password
def verifiqueContrasena(usuario_o_token, password):
    try:
        laAutorizacion = request.cookies.get('authorization')
        if usuario_o_token == "" and laAutorizacion is None:
            return False
        elToken = laAutorizacion[6:]
        elUsuario = verifiqueToken(elToken)
        if elUsuario is None:
            elUsuario = localDatabase.Usuarios.find_one({'Usuario': usuario_o_token})
            if elUsuario is not None:
                laContrasena = elUsuario['Contrasena']
                if laContrasena != password:
                    return False
                else:
                    return True
        else:
            return True
    except Exception as e:
        return formateeElError(e)


# ESTA RUTA HACE UN REDIRECCIONAMIENTO A LA PAGINA DE LOGIN
@app.route('/')
def redirection():
    laAccion = "Redireccion a login."
    ingreseElLog(laAccion)
    return redirect('/login', 302)


# ESTA RUTA MUESTRA LA PAGINA DE LOGIN
@app.route('/login')
def login():
    laAccion = "Ingreso al login."
    ingreseElLog(laAccion)
    return render_template('Login.html')


# ESTA RUTA MUESTRA LA PAGINA DE SIGNUP
@app.route('/signup')
def signup():
    laAccion = "Ingreso a signup."
    ingreseElLog(laAccion)
    return render_template('Signup.html')


# ESTA RUTA MUESTRA EL INDEX, DONDE SE PUEDE ELEGIR UN JUEGO
# SOLO O MULTIPLAYER.
@app.route('/index')
@auth.login_required
def index():
    laAccion = "Ingreso al index."
    ingreseElLog(laAccion)
    return render_template('Index.html')


# ESTA RUTA MUESTRA LA PAGINA PARA EL JUEGO SOLO
@app.route('/solo')
@auth.login_required
def soloGame():
    laAccion = "Ingreso a partida solo."
    ingreseElLog(laAccion)
    return render_template('Soloplayer.html')


# ESTA RUTA MUESTRA LA PAGINA PARA EL JUEGO MULTIPLAYER
@app.route('/multiplayer')
@auth.login_required
def multiplayerGame():
    laAccion = "Ingreso a pagina multiplayer."
    ingreseElLog(laAccion)
    return render_template('Multiplayer.html')


# ESTA FUNCION RECIBE UN FORM, EL CUAL PARSEA PARA OBTENER TODOS LOS DATOS INDIVIDUALES. REVISA
# SI EL USUARIO YA EXISTE, Y SI FUERA ASI, ENVIA UN MENSAJE DE ERROR; SI NO EXISTE, CREA EL
# USUARIO Y LO INGRESA A LA BASE DE DATOS.
@app.route('/api/create-user', methods=['POST'])
def createUser():
    try:
        losParametros = request.form
        laIdentificacion = str(ObjectId())
        elNombre = losParametros['Nombre']
        elApellido = losParametros['Apellido']
        elCorreo = losParametros['Correo']
        elUsuario = losParametros['Usuario']
        laContrasena = losParametros['Contrasena']
        laVerificacion = localDatabase.Usuarios.find_one({'Usuario': elUsuario})
        if laVerificacion is not None:
            laRespuesta = {"id": 2, "Mensaje": "Error: El usuario ya existe."}
            laRespuestaComoJSON = json.dumps(laRespuesta)
            laAccion = "Create user error."
            ingreseElLog(laAccion)
            return Response(laRespuestaComoJSON, 200, mimetype='application/json')
        elRegistro = {
            "_id": laIdentificacion,
            "Nombre": elNombre,
            "Apellido": elApellido,
            "Correo": elCorreo,
            "Usuario": elUsuario,
            "Contrasena": laContrasena
        }
        localDatabase.Usuarios.insert_one(elRegistro)
        laRespuesta = {"id": 1, "Mensaje": "El usuario se ha creado exitosamente."}
        laRespuestaComoJSON = json.dumps(laRespuesta)
        laAccion = "Create user: " + elUsuario
        ingreseElLog(laAccion)
        return Response(laRespuestaComoJSON, 200, mimetype='application/json')
    except Exception as e:
        return formateeElError(e)


# ESTE METODO VERIFICA LOS CREDENCIALES ENVIADOS EN EL HEADER, Y LOS DECODIFICA PARA OBTENER
# EL USUARIO Y CONTRASENA ORIGINALES. POSTERIORMENTE, CREA UN TOKEN UTILIZANDO ESOS DATOS
# Y SE LO ENVIA AL CLIENTE.
@app.route('/api/login')
@auth.login_required
def obtengaToken():
    try:
        laAutorizacion = request.headers.get('authorization')
        elCodigo = laAutorizacion[6:]
        laAutenticacion = base64.b64decode(elCodigo)
        laAutenticacionComoTexto = laAutenticacion.decode("utf-8")
        losCredenciales = laAutenticacionComoTexto.split(':')
        elUsuario = losCredenciales[0]
        laContrasena = losCredenciales[1]
        elToken = genereToken(elUsuario, laContrasena)
        laRespuesta = {'Token': elToken.decode('ascii')}
        laAccion = "Login"
        ingreseElLog(laAccion)
        return jsonify(laRespuesta)
    except Exception as e:
        return formateeElError(e)


# ESTA FUNCION RECIBE UN JSON E INGRESA EL NOMBRE Y PUNTAJE DE CADA JUGADOR
# LA BASE DE DATOS PARA LUEGO CREAR EL RANKING. SI EL JUGADOR ES NUEVO LO
# INGRESA DE UNA, SI NO ES NUEVO REVISA SI EL PUNTAJE ES MAYOR AL QUE TENIA.
@app.route('/api/save-player', methods=['POST'])
def savePlayer():
    laInformacion = request.json
    elJugador = laInformacion['jugador']
    elPuntaje = laInformacion['puntaje']
    laBusqueda = localDatabase.Ranking.find_one({'_id': elJugador})
    if laBusqueda is None:
        localDatabase.Ranking.insert_one({'_id': elJugador, 'Puntaje': elPuntaje})
        print("New player saved.")
    else:
        elAntiguoPuntaje = int(laBusqueda['Puntaje'])
        if elPuntaje > elAntiguoPuntaje:
            localDatabase.Ranking.update({'_id': elJugador}, {'$set': {'Puntaje': elPuntaje}})
            print("Player updated.")
    laAccion = "Se guarda puntaje de: " + elJugador
    ingreseElLog(laAccion)
    return "True"


# ESTA FUNCION OBTIENE LOS DIEZ MEJORES JUGADORES SEGUN SU PUNTAJE, Y LO ENVIA EN UN JSON.
@app.route('/api/show-ranking', methods=['GET'])
def showRanking():
    elTop10 = localDatabase.Ranking.find().sort('Puntaje', -1).limit(10)
    laRespuesta = {}
    laPosicion = 1
    for cadaJugador in elTop10:
        laRespuesta['Jugador' + str(laPosicion)] = {"Jugador": cadaJugador['_id'], "Puntaje": cadaJugador['Puntaje']}
        laPosicion += 1
    laRespuestaComoJSON = json.dumps(laRespuesta)
    return Response(laRespuestaComoJSON, 200, mimetype='application/json')


# ESTA FUNCION IMPRIME CADA JUGADOR QUE SE CONECTA AL SOCKET.
@socketio.on('connect')
def connected():
    laAccion = "Conexion al socket."
    ingreseElLog(laAccion)
    print('Connected: ' + request.sid)


# ESTA FUNCION RECIBE LA IDENTIFICACION DE SOCKET DE CADA JUGADOR, Y LO INGRESA A LA
# COLA DEL JUEGO 2/3. CUANDO EN LA COLA HAY DOS JUGADORES, LOS INGRESA A LA MISMA SALA
# PARA QUE PUEDAN JUGAR, Y LOS ELIMINA DE LA COLA.
@socketio.on('join-2/3')
def on_join_23():
    elSocketID = request.sid
    elUsuario = definaElUsuario()
    if len(laColaModo23) < 2:
        laColaModo23.append([elSocketID, elUsuario])
        localDatabase.Colas.insert_one({'_id': elSocketID, 'Usuario': elUsuario, 'GameMode': '2/3'})
        laAccion = "Ingresa a cola de juego 2/3"
        ingreseElLog(laAccion)
    if len(laColaModo23) == 2:
        elSID1 = laColaModo23[0][0]
        elSID2 = laColaModo23[1][0]
        for cadaSala in lasSalas23:
            laBusqueda = localDatabase.Salas.find_one({'_id': cadaSala})
            if laBusqueda is None:
                localDatabase.Salas.insert_one(
                    {'_id': cadaSala, 'Usuario1': laColaModo23[0][1], 'Usuario2': laColaModo23[1][1]})
                join_room(cadaSala, elSID1)
                localDatabase.Colas.remove({'_id': elSID1})
                laRespuesta1 = json.dumps({'player': '1', 'room': cadaSala})
                socketio.emit('join', laRespuesta1, skip_sid=elSID2)
                join_room(cadaSala, elSID2)
                localDatabase.Colas.remove({'_id': elSID2})
                laRespuesta2 = json.dumps({'player': '2', 'room': cadaSala})
                socketio.emit('join', laRespuesta2, skip_sid=elSID1)
                socketio.emit('message', laColaModo23[0][1] + 'has joined the game.', room=cadaSala)
                socketio.emit('message', laColaModo23[1][1] + 'has joined the game.', room=cadaSala)
                break
        laColaModo23.clear()
        laAccion = "Empieza juego 2/3"
        ingreseElLog(laAccion)


# ESTA FUNCION RECIBE LA IDENTIFICACION DE SOCKET DE CADA JUGADOR, Y LO INGRESA A LA
# COLA DEL JUEGO 3/5. CUANDO EN LA COLA HAY DOS JUGADORES, LOS INGRESA A LA MISMA SALA
# PARA QUE PUEDAN JUGAR, Y LOS ELIMINA DE LA COLA.
@socketio.on('join-3/5')
def on_join_35():
    elSocketID = request.sid
    elUsuario = definaElUsuario()
    if len(laColaModo35) < 2:
        laColaModo35.append([elSocketID, elUsuario])
        localDatabase.Colas.insert_one({'_id': elSocketID, 'Usuario': elUsuario, 'GameMode': '3/5'})
        laAccion = "Ingresa a cola de juego 3/5"
        ingreseElLog(laAccion)
    if len(laColaModo35) == 2:
        elSID1 = laColaModo35[0][0]
        elSID2 = laColaModo35[1][0]
        for cadaSala in lasSalas35:
            laBusqueda = localDatabase.Salas.find_one({'_id': cadaSala})
            if laBusqueda is None:
                localDatabase.Salas.insert_one(
                    {'_id': cadaSala, 'Usuario1': laColaModo35[0][1], 'Usuario2': laColaModo35[1][1]})
                join_room(cadaSala, elSID1)
                localDatabase.Colas.remove({'_id': elSID1})
                laRespuesta1 = json.dumps({'player': '1', 'room': cadaSala})
                socketio.emit('join', laRespuesta1, skip_sid=elSID2)
                join_room(cadaSala, elSID2)
                localDatabase.Colas.remove({'_id': elSID2})
                laRespuesta2 = json.dumps({'player': '2', 'room': cadaSala})
                socketio.emit('join', laRespuesta2, skip_sid=elSID1)
                socketio.emit('message', laColaModo35[0][1] + 'has joined the game.', room=cadaSala)
                socketio.emit('message', laColaModo35[1][1] + 'has joined the game.', room=cadaSala)
                break
        laColaModo35.clear()
        laAccion = "Empieza juego 3/5"
        ingreseElLog(laAccion)


# ESTA FUNCION RECIBE LA IDENTIFICACION DE SOCKET DE CADA JUGADOR, Y LO INGRESA A LA
# COLA DEL JUEGO 4/7. CUANDO EN LA COLA HAY DOS JUGADORES, LOS INGRESA A LA MISMA SALA
# PARA QUE PUEDAN JUGAR, Y LOS ELIMINA DE LA COLA.
@socketio.on('join-4/7')
def on_join_47():
    elSocketID = request.sid
    elUsuario = definaElUsuario()
    if len(laColaModo47) < 2:
        laColaModo47.append([elSocketID, elUsuario])
        localDatabase.Colas.insert_one({'_id': elSocketID, 'Usuario': elUsuario, 'GameMode': '4/7'})
        laAccion = "Ingresa a cola de juego 4/7"
        ingreseElLog(laAccion)
    if len(laColaModo47) == 2:
        elSID1 = laColaModo47[0][0]
        elSID2 = laColaModo47[1][0]
        for cadaSala in lasSalas47:
            laBusqueda = localDatabase.Salas.find_one({'_id': cadaSala})
            if laBusqueda is None:
                localDatabase.Salas.insert_one(
                    {'_id': cadaSala, 'Usuario1': laColaModo47[0][1], 'Usuario2': laColaModo47[1][1]})
                join_room(cadaSala, elSID1)
                localDatabase.Colas.remove({'_id': elSID1})
                laRespuesta1 = json.dumps({'player': '1', 'room': cadaSala})
                socketio.emit('join', laRespuesta1, skip_sid=elSID2)
                join_room(cadaSala, elSID2)
                localDatabase.Colas.remove({'_id': elSID2})
                laRespuesta2 = json.dumps({'player': '2', 'room': cadaSala})
                socketio.emit('join', laRespuesta2, skip_sid=elSID1)
                socketio.emit('message', laColaModo47[0][1] + 'has joined the game.', room=cadaSala)
                socketio.emit('message', laColaModo47[1][1] + 'has joined the game.', room=cadaSala)
                break
        laColaModo47.clear()
        laAccion = "Empieza juego 4/7"
        ingreseElLog(laAccion)


# ESTE METODO SE UTILIZA PARA EL CHAT DENTRO DE LA SALA DE JUEGO. EL SOCKET RECIBE
# UN MENSAJE POR PARTE DE UN JUGADOR, Y LO ENVIA A TODOS LOS JUGADORES QUE ESTEN
# EN LA SALA.
@socketio.on('message')
def handle_message(message):
    elMensaje = message['message']
    laSala = message['room']
    print('Mensaje: ' + elMensaje + " Sala: " + laSala)
    socketio.emit('message', elMensaje, room=laSala)
    laAccion = "Envia mensaje en chat."
    ingreseElLog(laAccion)


# ESTA FUNCION RECIBE LA INFORMACION DE LAS TECLAS PRESIONADAS POR EL JUGADOR
# Y LAS ENVIA A TODOS LOS JUGADORES DE LA MISMA SALA PARA QUE EL CLIENTE
# HAGA LAS ACTUALIZACIONES CORRESPONDIENTES.
@socketio.on('keypress')
def keypress(keypress):
    laTecla = keypress['key']
    elJugador = keypress['player']
    laSala = keypress['room']
    elMovimiento = {
        "player": elJugador,
        "key": laTecla
    }
    elMovimientoComoJSON = json.dumps(elMovimiento)
    print('Jugador: ' + str(elJugador) + ". Tecla: " + str(laTecla) + ". Sala: " + str(laSala))
    socketio.emit('keypress', elMovimientoComoJSON, room=laSala)


# ESTA FUNCION SACA A AMBOS JUGADORES DE LA SALA DE JUEGO, TANTO EL QUE
# QUISO SALIR, COMO EL QUE SEGUIA JUGANDO.
@socketio.on('leave')
def on_leave(data):
    elUsuario = definaElUsuario()
    laSala = data['room']
    laBusqueda = localDatabase.Salas.find_one({'_id': laSala})
    if laBusqueda is not None:
        localDatabase.Salas.remove({'_id': laSala})
        socketio.emit('kick', room=laSala)
    leave_room(laSala)
    print(elUsuario + " has left the room.")
    socketio.send(elUsuario + ' has left the room.', room=laSala)
    laAccion = "Sale de la partida."
    ingreseElLog(laAccion)


# ESTA FUNCION REVISA EL USUARIO DE LA SESION. SI REALIZA UNA CONEXION DIRECTA CON EL AUTENTICADOR,
# SE OBTIENE DE AHI; SINO SE REVISA LOS CREDENCIALES DEL HEADER, SE DECODIFICAN, Y SE OBTIENE EL
# USUARIO. EN CASO DE QUE NO HUBIERAN CREDENCIALES, SE LE ASIGNA LA DIRECCION IP AL USUARIO.
def definaElUsuario():
    elUsuario = auth.username()
    if elUsuario == "":
        laAutorizacion = request.headers.get('authorization')
        if laAutorizacion is None:
            elUsuario = request.remote_addr
        else:
            elCodigo = laAutorizacion[6:]
            laAutenticacion = base64.b64decode(elCodigo)
            elToken = laAutenticacion.decode("utf-8")
            elUsuario = verifiqueToken(elToken)
    return elUsuario


# ESTA FUNCION CREA CADA LOG DE OPERACIONES. PRIMERO DEFINE EL USUARIO QUE REALIZA LA ACCION,
# LUEGO CREA EL LOG Y LO INGRESA A LA BASE DE DATOS.
def ingreseElLog(laAccion):
    elUsuario = definaElUsuario()
    elLog = {
        "_id": str(ObjectId()),
        "Usuario": elUsuario,
        "Fecha": datetime.datetime.now(),
        "Accion": laAccion
    }
    localDatabase.Log_Operaciones.insert_one(elLog)


# ESTA FUNCION OBTIENE LOS ERRORES, LOS FORMATEA Y ENVIA UNA RESPUESTA CON LA
# INFORMACION CORRESPONDIENTE.
def formateeElError(e):
    elErrorComoTexto = str(e)
    elEnunciado = "Lo lamento. Ha ocurrido un error " + elErrorComoTexto
    elEnunciadoComoJSON = json.dumps(elEnunciado)
    elErrorHTTP = elErrorComoTexto[:3]
    laActividad = elErrorComoTexto
    ingreseElLog(laActividad)
    return Response(elEnunciadoComoJSON, elErrorHTTP, mimetype="application/json")


# ESTA FUNCION CREA UN TOKEN DE AUTENTICACION. SE DEFINE LA SERIE SEGUN LA LLAVE SECRETA,
# Y LUEGO CREA EL TOKEN UTILIZANDO EL USUARIO Y CONTRASENA QUE RECIBE COMO PARAMETRO. CADA
# TOKEN EXPIRA CADA MEDIA HORA.
def genereToken(usuario, contrasena, expiration=1800):
    laSerie = Serializer(app.config['SECRET_KEY'], expires_in=expiration)
    elToken = laSerie.dumps({'Usuario': usuario, 'Contrasena': contrasena})
    return elToken


# ESTE METODO VERIFICA SI EL TOKEN ES VALIDO. DEFINE LA SERIE SEGUN LA LLAVE SECRETA,
# LUEGO CARGA EL TOKEN Y LO DECODIFICA SEGUN LA SERIE, Y REVISA SI EL TOKEN EXPIRO,
# SI ES INVALIDO, O SINO, OBTIENE EL USUARIO Y LO DEVUELVE.
def verifiqueToken(token):
    laSerie = Serializer(app.config['SECRET_KEY'])
    try:
        losDatos = laSerie.loads(token)
    except SignatureExpired:
        return None
    except BadSignature:
        return None
    elUsuario = losDatos['Usuario']
    print(elUsuario)
    return elUsuario


# AQUI SE INICIALIZA EL PROGRAMA
if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
