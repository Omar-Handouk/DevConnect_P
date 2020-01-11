'use strict';

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const setup = require('./config/setup').setup;

const app = express();

// Define middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(require('morgan')('dev'));

// Define routes
app.use(require('helmet')());
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

setup(app, mongoose)
	.then(() => {
		let date = new Date();
		console.info(`[${date.toISOString()}] || Server launched successfully!`);
	})
	.catch(() => {
		let date = new Date();
		console.error(`[${date.toISOString()}] || Server launch error`);
	});
