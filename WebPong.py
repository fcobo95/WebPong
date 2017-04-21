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
# SE INICIALIZA LA AUTENTICACION BASICA.
app = Flask(__name__)
app.config['SECRET_KEY'] = 'JE9395ccce'
auth = HTTPBasicAuth()
socketio = SocketIO(app)

# ESTA FUNCION CORRE UNA VEZ AL INICIAR EL SERVIDOR, EN DONDE CREA LA CONEXION CON LA BASE
# DE DATOS LOCAL.
with app.app_context():
    clienteLocal = MongoClient('localhost', 27017)
    localDatabase = clienteLocal.MongoLocal


# ESTE METODO VERIFICA QUE EL USUARIO SEA VALIDO, AL RECIBIR DOS PARAMETROS. PRIMERO REVISA SI
# LO QUE RECIBE ES UN TOKEN Y SI ES VALIDO, SI NO ES ASI, BUSCA EL USUARIO EN LA BASE DE DATOS
# Y VERIFICA SI EL USUARIO Y LA CONTRASENA COINCIDEN CON LOS REGISTROS.
@auth.verify_password
def verifiqueContrasena(usuario_o_token, password):
    try:
        elUsuario = verifiqueToken(usuario_o_token)
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


@app.route('/')
def redirection():
    return redirect('/login', 302)


@app.route('/login')
def login():
    return render_template('login.html')


@app.route('/signup')
def signup():
    return render_template('signup.html')


# TODO: AGREGAR AUTENTICACION
@app.route('/index')
def index():
    return render_template('index.html')


# TODO: AGREGAR AUTENTICACION
@app.route('/solo')
def soloGame():
    return render_template('Soloplayer.html')

@app.route('/multiplayer')
def multiplayerGame():
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


@app.route('/api/check-room', methods=['POST'])
def checkRoom():
    laInformacion = request.json
    laSala = laInformacion['room']
    laBusqueda = localDatabase.Salas.find_one({'_id': laSala})
    if laBusqueda is None:
        return 'True'
    else:
        if laBusqueda['UsuarioB'] == '':
            return 'True'
        else:
            return 'False'


@socketio.on('connect')
def connected():
    print('Connected.')


@socketio.on('join')
def on_join(message):
    elUsuario = definaElUsuario()
    laSala = message['room']
    laBusqueda = localDatabase.Salas.find_one({'_id': laSala})
    if laBusqueda is None:
        localDatabase.Salas.insert_one({'_id': laSala, 'UsuarioA': elUsuario, 'UsuarioB': ''})
        join_room(laSala)
        print(elUsuario + " joined.")
        socketio.emit('message', elUsuario + ' has joined the room.', room=laSala)
    else:
        if laBusqueda['UsuarioB'] == '':
            localDatabase.Salas.update({'_id': laSala}, {'$set': {'UsuarioB': elUsuario}})
            join_room(laSala)
            print(elUsuario + " joined.")
            socketio.emit('message', elUsuario + ' has joined the room.', room=laSala)
        else:
            print("Room full.")
            socketio.emit('message', 'error-001')


@socketio.on('message')
def handle_message(message):
    elMensaje = message['message']
    laSala = message['room']
    print('Mensaje: ' + elMensaje + " Sala: " + laSala)
    socketio.emit('message', elMensaje, room=laSala)

# TODO: REVISAR SI ES NECESARIO CERRAR EL ROOM POR SOCKET Y BORRAR EN BASE DE DATOS
@socketio.on('leave')
def on_leave(data):
    elUsuario = definaElUsuario()
    laSala = data['room']
    laBusqueda = localDatabase.Salas.find_one({'_id': laSala})
    if laBusqueda['UsuarioA'] == elUsuario:
        elOtroUsuario = laBusqueda['UsuarioB']
        if elOtroUsuario != "":
            localDatabase.Salas.update({'_id': laSala}, {'$set': {'UsuarioA': elOtroUsuario}})
            localDatabase.Salas.update({'_id': laSala}, {'$set': {'UsuarioB': ""}})
        else:
            localDatabase.Salas.remove({'_id': laSala})
    elif laBusqueda['UsuarioB'] == elUsuario:
        localDatabase.Salas.update({'_id': laSala}, {'$set': {'UsuarioB': ""}})
    leave_room(laSala)
    print(elUsuario + " has left the room.")
    socketio.send(elUsuario + ' has left the room.', room=laSala)


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
    return elUsuario


# AQUI SE INICIALIZA EL PROGRAMA
if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
