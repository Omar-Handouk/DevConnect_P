'use strict';

const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const { model: userModel } = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

router.post(
	'/',
	check('name', 'Name is required').notEmpty(),
	check('email', 'Please include a valid email')
		.isEmail()
		.notEmpty(),
	check('password', 'Please enter a password of 6 characters or more').isLength({
		min: 6
	}),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let { name, email, password } = req.body;

		let userDoc = {
			name,
			email: email.toLowerCase(),
			password: bcrypt.hashSync(password, 10),
			avatar: gravatar.url(email, {size: '200', rating: 'pg', default: 'identicon'})
		};

		let user = null;

		try {
			user = await userModel.create(userDoc);
		} catch (e) {
			if (e.message.includes('duplicate key')) {
				console.error(e.message);
				return res.status(409).json({ errors: [{ msg: 'User already registered' }] });
			} else {
				console.error(e.message);
				return res.status(500).json({errors: [{msg: 'Server error'}]});
			}
		}

		let payload = {
			user: {
				id: user.id
			}
		};

		let jwtOptions = {
			expiresIn: config.get('jwt.expiration').toString()
		};

		let token = jwt.sign(payload, config.get('jwt.secret'), jwtOptions);

		return res.status(201).json({ token });
	}
);

module.exports = router;
