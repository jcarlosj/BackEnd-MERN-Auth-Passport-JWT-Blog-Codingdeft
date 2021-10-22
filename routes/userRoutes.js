const
    express = require( 'express' ),
    router = express .Router(),
    passport = require( 'passport' ),
    User = require( '../models/user' ),
    { getToken, COOKIE_OPTIONS, getRefreshToken } = require( '../authenticate' );

// * Define la ruta de registro de usuario
router .post( '/signup', ( request, response, next ) => {

    // ! Verifica que el campo nombre esté vacío
    if( ! request .body .firstName ) {
        response .statusCode = 500;
        response .send({
            name: 'FirstNameError',
            message: 'The first name is required!'
        });
    }
    else {
        // * Registra el usuario, invocando la funcion 'register' de la dependencia 'password-local-mongoose'
        User.register(

            new User({
                username: request .body .username,
            }),
            request .body .password,
            ( err, user ) => {

                // ! Verifica si hay un error al insertar
                if( err ) {
                    response .statusCode = 500;
                    response .send( err );
                }
                else {
                    // * Agrega propiedades y sus valores al objeto
                    user .firstName = request .body .firstName;                 // ? Agrega valor del primer nombre al objeto
                    user .lastName = request .body .lastName || '';             // ? Agrega valor del segundo nombre al objeto

                    const
                        token = getToken({ _id: user ._id }),                   // ? Obtiene el Token
                        refreshToken = getRefreshToken({ _id: user ._id });     // ? Obtiene Token de Actualización

                    user .refreshToken .push({ refreshToken });                 // ? Agrega Token de Actualización añ objeto

                    user .save( ( error, theuser ) => {                         // * Guarda cambios en la base de datos

                        // ! Verifica si hay un error al guardar cambios en la BD
                        if( error ) {
                            response .statusCode = 500;
                            response .send( err );
                        }
                        else {
                            // * Establece el Token de Actualizacion como Cookie y envia respuesta.
                            response .cookie( 'refreshToken', refreshToken, COOKIE_OPTIONS );
                            response .send({ success: true, token })
                        }
                    });

                }
            }
        )

    }

});

// * Define la ruta de ingreso del usuario, usando el Middleware de autenticacion de passport
router .post( '/login', passport .authenticate( 'local' ), ( request, response, next ) => {

    const
        token = getToken({ _id: request .user ._id }),                  // ? Obtiene el Token
        refreshToken = getRefreshToken({ _id: request .user ._id });    // ? Obtiene Token de Actualización

    // * Busca si el usuario con el ID indicado esta registrado
    User .findById( request .user ._id )
            .then( user => {
                user .refreshToken .push({ refreshToken });             // ? Agrega Token de Actualización añ objeto

                user .save( ( err, user ) => {

                    // ! Verifica si hay un error al guardar cambios en la BD
                    if( err ) {
                        response .statusCode = 500;
                        response .send( err );
                    }
                    else {
                        // * Establece el Token de Actualizacion como Cookie y envia respuesta.
                        response .cookie( 'refreshToken', refreshToken, COOKIE_OPTIONS );
                        response .send({ success: true, token });
                    }

                });
            }, error => next( error ) );

});

module .exports = router;