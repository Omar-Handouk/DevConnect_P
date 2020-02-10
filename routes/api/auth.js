'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const router = require('express').Router();
const auth = require('../../middleware/auth');
const { model: userModel } = require('../../models/User');
const { check, validationResult } = require('express-validator');

router.post(
	'/',
	check('email', 'Please enter a valid email')
		.isEmail()
		.notEmpty(),
	check('password', 'Please enter a password').notEmpty(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let { email, password } = req.body;

		let user = null;

		try {
			user = await userModel.findOne({ email: email.toLowerCase() });
		} catch (e) {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		if (!user) {
			return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
		} else if (!bcrypt.compareSync(password, user.password)) {
			return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
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

		res.status(200).json({ token });
	}
);

router.get('/', auth, async (req, res) => {
	let profile = null;

	try {
		profile = await userModel.findById(req.user.id).select('-password');
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (!profile) {
		return res.status(404).json({ errors: [{ msg: 'User was not found' }] });
	}

	res.status(200).json(profile);
});

module.exports = router;
