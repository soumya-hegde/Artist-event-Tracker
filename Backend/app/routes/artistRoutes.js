const express = require('express');

const { createArtistProfile } = require('../controller/artistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/profile', authMiddleware, roleMiddleware(['artist']), createArtistProfile);

module.exports = router;
