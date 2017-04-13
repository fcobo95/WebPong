function signup_function() {
    /* ******************************************************************
     *
     * PARA LA PARTE DEL SIGNUP, EL USUARIO
     * DEBERA DE PROVEER UN NOMBRE, APELLIDO
     * CORREO ELECTRONICO, USUARIO Y UNA
     * CONTRASEñA.
     *
     * SI ALGUNO DE LOS CAMPOS SE ENCUENTRA
     * VACION, SE LE TIRA AL USUARIO UN ALERT
     * EN EL CUAL SE LE SOLICITA QUE TERMINE
     * DE INGRESAR LOS DATOS.
     *
     * SI TODOS LOS DATOS YA ESTAN INGRESADOS
     * Y LE DA CLIC AL BOTON DE SUBMIT, EL
     * PEDIDO AJAX SALE Y CREA EL USUARIO.
     *
     * ****************************************************************** */
    var name = $("#name").val();
    var lastName = $("#lname").val();
    var email = $("#email").val();
    var user = $("#user").val();
    var password = $("#password").val();
    if (name && lastName && email && user && password) {
        var formData = $("#signup").serialize();
        $.ajax({
            "async": true,
            "url": "/api/create-user",
            "method": "POST",
            "dataType": "json",
            "processData": false,
            "data": formData,
            success: function (response) {
                console.log(response);
                alert(response.Mensaje)
                if (response.id == 1) {
                    window.location.href = "/login";
                }
            },
            error: function (response) {
                console.log(response);
                alert(response.Mensaje)
            }
        });
    } else {
        alert("Error: Por favor llene los campos solicitados.")
    }
}