const
    passport = require( 'passport' ),
    JwtStrategy = require( 'passport-jwt' ) .Strategy,
    ExtractJWT = require( 'passport-jwt' ) .ExtractJwt,             //  Retorna nu nuevo extractor configurado con los parametros dados
    User = require( '../models/user' );

const options = {}                                                      //  es un objeto literal que contiene opciones para controlar cómo se extrae el token de la solicitud o se verifica

options .jwtFromRequest = ExtractJWT .fromAuthHeaderAsBearerToken();    //  crea un nuevo extractor que busca el JWT en el encabezado de autorización con el esquema 'bearer'
options .secretOrKey = process .env .JWT_SECRET;                        //  es una cadena o búfer que contiene la clave pública secreta (simétrica) o codificada en PEM (asimétrica) para verificar la firma del token

// ? Usado por los Request autenticadas para deserializar al usuario y obtener detalles del usuario del JWT
passport .use( new JwtStrategy( options, ( jwt_payload, done ) => {

    // ? jwt_payload: es un objeto literal que contiene la carga útil JWT decodificada

    // ? Comprueba con la BD solo si es necesario, Esto se puede evitar si no desea obtener detalles del usuario en cada solicitud
    User .findOne({ _id: jwt_payload ._id }, ( error, user ) => {

        // ! done es un error de pasaporte la primera devolución de llamada se acepta argumentos hechos (error, usuario, información)
        if( error ) return done( error, false );
        if( user ) return done( null, user );
        else return done( null, false );                            //  O puedes crear una nueva cuenta
    });

}));