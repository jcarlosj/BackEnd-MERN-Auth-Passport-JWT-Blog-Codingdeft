const
    express = require( 'express' ),             // Importa Express
    cors = require( 'cors' ),                   // Permite Cross-Origin Resource Sharing
    cookieParser = require( 'cookie-parser' );

// ? Valida si el entorno de desarrollo no es el de producción
if ( process .env .NODE_ENV !== 'production' ) {
    // ? Carga variables de entorno desde el archivo .env
  require( 'dotenv' ) .config();
}

require( './utils/connectdb' );                 // Obtiene Configuración Conexión Base de Datos

const app = express();                          // Asigna Express al inicio de la app

app .use( express .json() );                                // Habilita uso de JSON (Obliga enviar 'Content-Type':'application/json' el header de la petición)
app .use( cookieParser( process .env .COOKIE_SECRET ) );    //  Habilita analisis de cookies usando cadenas secretas y asigna al cuerpo del request.

// ? Agregue la URL del cliente a la política CORS
const whitelist = process .env .WHITELISTED_DOMAINS
    ?   process .env .WHITELISTED_DOMAINS .split( ',' )
    :   []

// ? Define opciones de configuracion para la transferencia de datos
const corsOptions = {
    origin: ( origin, callback ) => {
        if( ! origin || whitelist .indexOf( origin ) !== -1 ) {
            callback( null, true );
        }
        else {
            callback( new Error( 'Not allowed by CORS' ) );
        }
    },
    credentials: true,
}

app .use( cors( corsOptions ) );    // Habilita transferencias de datos entre navegadores y servidores.

app .get( '/', ( request, response ) => {
    response .send({ status: 'success' });
})

// ? Inicia el servidor en el puerto 8081
const server = app .listen( process .env .PORT || 8081, () => {     // Define variable de entorno para el puerto de escucha
    const port = server .address() .port;

    console.log( `App started at port: ${ port }` );
})