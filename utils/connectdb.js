const
	mongoose = require( 'mongoose' ),
	url = process .env .MONGO_DB_CONNECTION_STRING
	connect = mongoose .connect( url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		// useCreateIndex: true,
	})

	connect
		.then( db => {
			console.log( 'Connected to DB' );
		})
		.catch( err => {
				console .log( err );
		})