'use strict';

module.exports = {
	dbConfig: {
		dbName: 'development',
		user: process.env.dbUser,
		pass: process.env.dbPass,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true
	},
	jwt: {
		secret: '5BE95CB52C1359C93641248B45182',
		expiration: '365d'
	}
};
