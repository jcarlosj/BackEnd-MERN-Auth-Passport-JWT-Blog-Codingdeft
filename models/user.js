const
    mongoose = require( 'mongoose' ),
    passportLocalMongoose = require( 'passport-local-mongoose' ),
    Schema = mongoose .Schema;

// Estructura de datos para almacenar tokens de actualización
const Session = new Schema({
    refreshToken: {
        type: String,
        default: ''
    }
});

// Estructura de datos para almacenar datos de Usuarios
const User = new Schema({
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    authStrategy: {
        type: String,
        default: 'local'
    },
    points: {
        type: Number,
        default: 50
    },
    refreshToken: {
        type: [ Session ]
    }
});

// Elimina token de actualización del Response, para no exponer los tokens de actualizacion
// del usuario cada que se serializa el modelo y enviamos los datos en la respuesta de la API
User .set( 'toJSON', {
    transform: ( doc, ret, options ) => {
        delete ret .refreshToken;
        return ret
    }
});

// Complementa que proporciona funciones para autenticar y serializar los datos del Usuario
User .plugin( passportLocalMongoose );

module.exports = mongoose .model( 'User', User );