const express = require('express');

const { createEvent, getEvents } = require('../controller/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getEvents);
router.post('/', authMiddleware, roleMiddleware(['artist']), createEvent);

module.exports = router;
