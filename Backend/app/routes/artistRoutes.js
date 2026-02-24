const express = require('express');

const { createArtistProfile, getMyArtistProfile, updateArtistProfile } = require('../controller/artistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, roleMiddleware(['artist']), getMyArtistProfile);
router.post('/profile', authMiddleware, roleMiddleware(['artist']), createArtistProfile);
router.put('/profile', authMiddleware, roleMiddleware(['artist']), updateArtistProfile);

module.exports = router;
