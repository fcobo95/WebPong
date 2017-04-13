function login_function() {
    /* ******************************************************************
     *
     * AQUI LO QUE SE HACE ES VALIDAR QUE LOS
     * CAMPOS DE USUERNAME Y PASSWORD NO ESTEN
     * VACION, DE ESTARLO, LE ENVIA AL USUARIO
     * UN ALERT, PARA AVISARLE QUE SUS DATOS
     * NO HAN SIDO INGRESADOS, QUE LOS INGRESE.
     *
     * EN CASO DE HABER PUESTO TODOS LOS DATOS
     * EL AJAX SE HACE EFECTIVO.
     *
     * ***************************************************************** */

    var username = $("#user").val();
    var password = $("#password").val();
    var ip = "192.168.1.27";
    var local = "127.0.0.1";
    var port = "5000";
    if (username === "" || password === "") {
        alert("Error: Ingrese su usuario y contraseña.")
    } else {
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "http://" + local + port + "/api/login",
            "method": "GET",
            "headers": {
                "authorization": "Basic " + btoa(username + ":" + password)
            },
            success: function (response) {
                console.log(response);
                alert("Welcome, " + username + "!");
                sessionStorage.setItem("Token", response['Token'])
                window.location.href = "/index";
            },
            error: function (response) {
                console.log(response);
                alert("Error: " + response['responseText'])
            }
        };
        $.ajax(settings).done(function (response) {
            console.log(response);
        });
    }
}