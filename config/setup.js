'use strict';

const config = require('config');

const connectToDB = async (mongoose) => {
	let url = `mongodb+srv://${process.env.dbURL}`;

	let dbConfig = config.get('dbConfig');

	return mongoose.connect(url, dbConfig);
};

const runServer = async (app) => {
	return new Promise((resolve) => {
		app.listen(process.env.PORT, () => {
			resolve({ live: true });
		});
	});
};

const setup = async (app, mongoose) => {
	let date = new Date();

	let connection = undefined;

	try {
		connection = await connectToDB(mongoose);

		console.info(`[${date.toISOString()}] || Connected to database successfully!`);
	} catch (e) {
		console.error(
			`[${date.toISOString()}] || Error when connecting to database ${e.name}, ${
				e.message
			}`
		);
	}

	if (connection) {
		let server = undefined;

		try {
			server = await runServer(app);

			console.info(
				`[${date.toISOString()}] || Application listening to port: ${
					process.env.PORT
				}`
			);
		} catch (e) {
			console.error(
				`[${date.toISOString()}] || Error when launching server ${e.name}, ${
					e.message
				}`
			);
		}

		if (server) {
			return Promise.resolve({ launch: true });
		} else {
			return Promise.reject({ error: 'Server launch failed' });
		}
	} else {
		return Promise.reject({ error: 'Database connection failed' });
	}
};

module.exports = { setup };
