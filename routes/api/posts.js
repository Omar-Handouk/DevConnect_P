'use strict';

const router = require('express').Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const { model: userModel } = require('../../models/User');
const { model: postModel } = require('../../models/Post');

router.post(
	'/',
	auth,
	check('text', 'Post body is required').notEmpty(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let user = null;

		try {
			user = await userModel.findById(req.user.id).select('-password');
		} catch (e) {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		if (user === null) {
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		let payload = {
			user: req.user.id,
			text: req.body.text,
			name: user.name,
			avatar: user.avatar
		};

		let post = null;

		try {
			post = await postModel.create(payload);
		} catch (e) {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		if (post) {
			res.status(201).json(post);
		} else {
			res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}
	}
);

router.get('/all', async (req, res) => {
	let posts = null;

	try {
		posts = await postModel.find().sort({ date: -1 });
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (posts) {
		return res.status(200).json(posts);
	} else {
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}
});

router.get('/', auth, async (req, res) => {
	let posts = null;

	try {
		posts = await postModel.find({ user: req.user.id }).sort({ date: -1 });
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (posts) {
		res.status(200).json(posts);
	} else {
		res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}
});

router.get('/:id', auth, async (req, res) => {
	let post = null;

	try {
		post = await postModel.findOne({ user: req.user.id, _id: req.params.id });
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (post) {
		res.status(200).json(post);
	} else {
		return res.status(404).json({ errors: [{ msg: 'Post not found' }] });
	}
});

router.delete('/:id', auth, async (req, res) => {
	try {
		let post = await postModel.findOneAndDelete({
			user: req.user.id,
			_id: req.params.id
		});

		if (post !== null)
			return res.status(200).json({ info: [{ msg: 'Post deleted successfully!' }] });
		else return res.status(404).json({ errors: [{ msg: 'Post not found' }] });
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}
});

router.put('/like/:id', auth, async (req, res) => {
	let post = null;

	try {
		post = await postModel.findOneAndUpdate(
			{ _id: req.params.id, 'likes.user': { $ne: req.user.id } },
			{ $push: { likes: { user: req.user.id } } }
		);
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (post) {
		res.status(200).json({ info: [{ msg: 'Liked post' }] });
	} else {
		res.status(400).json({ errors: [{ msg: 'Already liked post' }] });
	}
});

router.put('/unlike/:id', auth, async (req, res) => {
	let post = null;

	try {
		post = await postModel.findOneAndUpdate(
			{ _id: req.params.id, 'likes.user': req.user.id },
			{ $pull: { likes: { user: req.user.id } } }
		);
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (post) {
		res.status(200).json({ info: [{ msg: 'Un-liked post' }] });
	} else {
		res.status(400).json({ errors: [{ msg: 'Post has not yet been liked' }] });
	}
});

router.post(
	'/comment/:id',
	auth,
	check('text', 'Comment body is required').notEmpty(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let user = null;

		try {
			user = await userModel.findById(req.user.id).select('-password');
		} catch (e) {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		if (user === null) {
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		let payload = {
			user: req.user.id,
			text: req.body.text,
			name: user.name,
			avatar: user.avatar
		};

		let post = null;

		try {
			post = await postModel.findOneAndUpdate(
				{ _id: req.params.id },
				{ $push: { comments: payload } }
			);
		} catch (e) {
			console.error(e.message);
			return res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}

		if (post) {
			res.status(200).json({ info: [{ msg: 'Comment added' }] });
		} else {
			res.status(500).json({ errors: [{ msg: 'Server error' }] });
		}
	}
);

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
	let post = null;

	try {
		let conditions = {
			_id: req.params.id,
			'comments._id': req.params.comment_id,
			'comments.user': req.user.id
		};

		let update = {
			$pull: {
				comments: {
					_id: req.params.comment_id,
					user: req.user.id
				}
			}
		};

		post = await postModel.findOneAndUpdate(conditions, update);
	} catch (e) {
		console.error(e.message);
		return res.status(500).json({ errors: [{ msg: 'Server error' }] });
	}

	if (post) {
		res.status(200).json({ info: [{ msg: 'Comment deleted' }] });
	} else {
		res.status(404).json({ errors: [{ msg: 'Comment not found' }] });
	}
});

module.exports = router;
