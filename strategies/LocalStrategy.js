const
    passport = require( 'passport' ),
    LocalStrategy = require( 'passport-local' ) .Strategy,
    User = require( '../models/user' );

// ? Invocación al realizar el inicio de sesión y registro (Autenticación)
passport .use( new LocalStrategy( User .authenticate() ) );

// ? Invocación después del inicio de sesión y registro para configurar detalles del Request del usuario (Serialización)
passport .serializeUser( User .serializeUser() );