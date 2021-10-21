const
    passport = require( 'passport' ),
    jwt = require( 'jsonwebtoken' ),
    dev = process.env.NODE_ENV !== 'production';

// ? Opciones para la creación de una Cookie de Token
// ! NOTA: Dado que localhost no tiene protocolo https, las cookies seguras no funcionan correctamente (en Postman)
exports .COOKIE_OPTIONS = {
    httpOnly: true,
    secure: ! dev,          //  Para que el JavaScript del Cliente no pueda leerla
    signed: true,
    maxAge: eval( process .env. REFRESH_TOKEN_EXPIRY ) * 1000,
    sameSite: 'none'                                                //  Esto por que tanto el cliente como el servidor estarán en dominios diferentes
}

// ? Crea Token usando JWT
exports .getToken = user => {
    return jwt .sign(
        user,
        process .env .JWT_SECRET,
        { expiresIn: eval( process .env .SESSION_EXPIRY ) }
    );
}

// ? Crea Token de Actualización usando JWT
exports .getRefreshToken = user => {
    const refreshToken = jwt .sign(
        user,
        process .env .REFRESH_TOKEN_SECRET,
        { expiresIn: eval( process .env .REFRESH_TOKEN_EXPIRY ) }
    );

    return refreshToken;
}

// ? verifyUser: Middleware que debe invocarse para cada solicitud autenticada
exports .verifyUser = passport .authenticate( 'jwt', { session: false } );