'use strict';

const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {

	const token = req.header('x-auth-token');

	if (!token) {
		return res.status(401).json({errors: [{msg: 'Access denied'}]});
	}

	let decoded = undefined;

	try {
		decoded = jwt.verify(token, config.get('jwt.secret'));

		req.user = decoded.user;
		next();
	} catch (e) {
		console.error(e.message);
		res.status(401).json({errors: [{msg: 'Token not valid'}]});
	}
};