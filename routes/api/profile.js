'use strict';

const router = require('express').Router();

/**
 * @route  GET api/profile
 * @desc   Test route
 * @access Private
 */
router.get('/', (req, res) => {
	res.send('Profile Route')
});

module.exports = router;