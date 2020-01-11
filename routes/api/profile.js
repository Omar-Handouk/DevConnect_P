'use strict';

const { check, validationResult } = require('express-validator');
const router = require('express').Router();
const auth = require('../../middleware/auth');
const axios = require('axios');

const { model: profileModel } = require('../../models/Profile');
const { model: userModel } = require('../../models/User');

router.post(
	'/',
	auth,
	check('status', 'Status is required').notEmpty(),
	check('skills', 'Skills are required').notEmpty(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		const generalInfo = [
			'company',
			'website',
			'location',
			'status',
			'skills',
			'bio',
			'githubUsername'
		];
		const social = ['youtube', 'twitter', 'facebook', 'linkedIn', 'instagram'];

		if (req.body.skills) {
			req.body.skills = req.body.skills.replace(' ', '');
		}

		let profile = {};
		profile.user = req.user.id;
		profile.social = {};

		generalInfo.forEach((value) => {
			if (req.body[value]) {
				if (value !== 'skills') {
					profile[value] = req.body[value];
				} else {
					profile[value] = req.body[value].split(',').map((value) => value.trim());
				}
			}
		});

		social.forEach((value) => {
			if (req.body[value]) {
				profile.social[value] = req.body[value];
			}
		});

		let dbResponse = null;

		try {
			dbResponse = await profileModel.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profile },
				{ new: true, upsert: true }
			);
		} catch (e) {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		if (!dbResponse) {
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		res.status(200).json(dbResponse);
	}
);

router.get('/me', auth, async (req, res) => {
	let user = null;

	try {
		user = await profileModel
			.findOne({ user: req.user.id })
			.populate('user', ['name', 'avatar']);
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (!user) {
		return res.status(404).json({ errors: [{ msg: 'Profile not found' }] });
	}

	res.status(200).json(user);
});

router.get('/', async (req, res) => {
	let profiles = null;

	try {
		profiles = await profileModel.find().populate('user', ['name', 'avatar']);
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (!profiles) {
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	return res.status(200).json(profiles);
});

router.get('/user/:id', async (req, res) => {
	let profile = null;

	try {
		profile = await profileModel
			.findOne({ user: req.params.id })
			.populate('user', ['name', 'avatar']);
	} catch (e) {
		console.error(e.message);
		return res.status(404).json({ errors: [{ msg: 'Profile not found' }] });
	}

	if (!profile) {
		return res.status(404).json({ errors: [{ msg: 'Profile not found' }] });
	}

	return res.status(200).json(profile);
});

router.put(
	'/experience',
	auth,
	check('title', 'Title is required').notEmpty(),
	check('company', 'Company is required').notEmpty(),
	check('from', 'From date is required').notEmpty(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(422).json({ errors: errors.array() });
		}

		let profile = null;

		try {
			profile = await profileModel.findOne({ user: req.user.id });

			profile.experience.unshift(req.body);

			await profile.save();
		} catch (e) {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		if (profile) {
			res.status(200).json(profile);
		} else {
			res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}
	}
);

router.delete('/experience/:id', auth, async (req, res) => {
	let profile = null;

	try {
		/*profile = await profileModel.findOne( { user: req.user.id } );
		profile.experience = profile.experience.filter(exp => exp._id.toString() !== req.params.id);*/

		profile = await profileModel.findOneAndUpdate(
			{ user: req.user.id },
			{ $pull: { experience: { _id: req.params.id } } },
			{ new: true }
		);
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (profile) {
		res.status(200).json(profile);
	} else {
		res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}
});

router.put(
	'/education',
	auth,
	check('school', 'School is required').notEmpty(),
	check('degree', 'Degree is required').notEmpty(),
	check('fieldOfStudy', 'Field of study is required').notEmpty(),
	check('from', 'From date is required')
		.notEmpty()
		.toDate(),
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let profile = null;

		try {
			profile = await profileModel.findOneAndUpdate(
				{ user: req.user.id },
				{ $push: { education: req.body } },
				{ new: true }
			);
		} catch (e) {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		if (profile) {
			res.status(200).json(profile);
		} else {
			res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}
	}
);

router.delete('/education/:id', auth, async (req, res) => {
	let profile = null;

	try {
		profile = await profileModel.findOneAndUpdate(
			{ user: req.user.id },
			{ $pull: { education: { _id: req.params.id } } },
			{ new: true }
		);
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (profile) {
		res.status(200).json(profile);
	} else {
		res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}
});

router.delete('/', auth, async (req, res) => {
	try {
		await profileModel.findOneAndDelete({ user: req.user.id });

		await userModel.findOneAndDelete({ _id: req.user.id });

		return res.status(200).json({ info: [{ msg: 'Profile deleted successfully' }] });
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}
});

router.get('/github/:username', async (req, res) => {
	let options = {
		responseType: 'json',
		headers: {
			'User-Agent': 'node.js'
		}
	};

	let response = null;

	let per_page = req.query.per_page || 10;
	let page = req.query.page || 1;
	let url =
		`https://api.github.com/users/${req.params.username}/repos?` +
		`per_page=${per_page}&page=${page}&sort=created:asc&` +
		`client_id=${process.env.GITHUB_CLIENT}&client_secret=${process.env.GITHUB_SECRET}`;

	try {
		response = await axios(encodeURI(url), options);
	} catch (e) {
		if (e.response) {
			console.error(e.response.statusText);
			return res
				.status(e.response.status)
				.json({ errors: [{ msg: 'No Github profile found' }] });
		} else {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}
	}

	if (response) {
		res.status(200).json(response.data);
	} else {
		res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}
});

module.exports = router;
