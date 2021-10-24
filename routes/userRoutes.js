const
    express = require( 'express' ),
    router = express .Router(),
    passport = require( 'passport' ),
    jwt = require( 'jsonwebtoken' ),
    User = require( '../models/user' ),
    { getToken, COOKIE_OPTIONS, getRefreshToken, verifyUser } = require( '../authenticate' );

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

// * Define la ruta para crear Token de Actualización
router .post( '/refreshToken', ( request, response, next ) => {

    const
        { signedCookies = {} } = request,
        { refreshToken } = signedCookies;       // ? Recuperamos el token de actualización de las cookies firmadas.

    console .log( request.signedCookies );

    // ? Verifica si el Token de Actualizacion fue pasado en el Request (Peticion).
    if( refreshToken ) {

        try {
            const
                payload = jwt .verify( refreshToken, process .env .REFRESH_TOKEN_SECRET ),      // ? Verifica Token de Actualización con el SECRET usado para generarlo
                userId = payload ._id;                                                          // ? Extrae la carga útil del Token (ID de usuario)

            // * Consulta si existe un usuario registrado con el ID obtenido del Token de Actualizacion enviado en la Peticion
            User .findOne({ _id: userId })
                    .then( user => {

                        // ? Verifica si se obtuvo un usuario de la base de datos.
                        if( user ) {
                            // * Busca el token de actualización contra el registro de usuario en la base de datos.
                            // ! NOTA: En caso de cierre de sesión de todos los dispositivos, se eliminarán todos los Tokens de Actualización del usuario.
                            const tokenIndex = user .refreshToken .findIndex( item => item .refreshToken === refreshToken );

                            // ? Verifica si hay un indice NO valido en la busqueda (En otras palabras que no encontró el Token de Actualización)
                            if( tokenIndex === -1 ) {
                                response .statusCode = 401;
                                response .send( 'Unauthorized. User without refresh token.' );
                            }
                            else {
                                // * Encuentra el Token de Actualización actualiza los Tokens
                                const
                                    token = getToken({ _id: userId }),                      // ? Obtiene nuevo Token de Autenticacion
                                    newRefreshToken = getRefreshToken({ _id: userId });     // ? Obtiene nuevo Token de Actualización

                                user .refreshToken[ tokenIndex ] = { refreshToken: newRefreshToken };   //  ? Si el token de actualización existe, cree uno nuevo y reemplácelo.

                                user .save( ( err, theUser ) => {

                                    // ! Verifica si hay un error al guardar cambios en la BD
                                    if( err ) {
                                        response .statusCode = 500;
                                        response .send( err );
                                    }
                                    else {
                                        // * Establece el Token de Actualizacion como Cookie y envia respuesta.
                                        response .cookie( 'refreshToken', newRefreshToken, COOKIE_OPTIONS );
                                        response .send({ success: true, user: theUser, token });
                                    }

                                });

                            }

                        }
                        else {
                            // ? Si el usuario no esta registrado
                            response .statusCode = 401;
                            response .send( 'Unauthorized, Unregistered user.' );
                        }

                    }, error => next( error ) );

        } catch (error) {
            response .statusCode = 401;
            response .send( 'Unauthorized, An error occurred.' );
        }

    }
    else {
        // ! Si NO existe el Token de Actualizacion
        response .statusCode = 401;
        response .send( 'Unauthorized. Request without refresh token.' );
    }

});

// * Define ruta para recuperar los datos del usuario (Endpoint)
router.get( '/me', verifyUser, ( request, response, next ) => {
    response .send( request .user );
});

// * Define ruta para el cierre de "sesión" o salida del sistema
router .get( '/logout', verifyUser, ( request, response, next ) => {
    console .log( 'Hola Sumerce' );
    const
        { signedCookies = {} } = request,
        { refreshToken } = signedCookies;           // ? Recuperamos el token de actualización de las cookies firmadas.

    // * Consulta si existe un usuario registrado con el ID obtenido del Token de Actualizacion enviado en la Peticion
    User .findById( request .user ._id )
            .then( user => {

                // * Busca el token de actualización contra el registro de usuario en la base de datos.
                // ! NOTA: En caso de cierre de sesión de todos los dispositivos, se eliminarán todos los Tokens de Actualización del usuario.
                const tokenIndex = user .refreshToken .findIndex( item => item .refreshToken === refreshToken );

                // ? Verifica si hay un indice valido en la busqueda y lo elimina
                if( tokenIndex !== -1 ) {
                    user .refreshToken .id( user .refreshToken[ tokenIndex ] ._id ) .remove();
                }

                user .save( ( err, theUser ) => {

                    // ! Verifica si hay un error al guardar cambios en la BD
                    if( err ) {
                        response .statusCode = 500;
                        response .send( err );
                    }
                    else {
                        // * Establece el Token de Actualizacion como Cookie y envia respuesta.
                        response .cookie( 'refreshToken', COOKIE_OPTIONS );
                        response .send({ success: true, user: theUser });
                    }

                });

            }, error => next( error ) );

});

module .exports = router;