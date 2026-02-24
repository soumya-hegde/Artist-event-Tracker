const express = require('express');

const { createEvent, getEvents, getMyEvents, getMyBookedEvents, deleteEvent } = require('../controller/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getEvents);
router.get('/my-events', authMiddleware, roleMiddleware(['artist']), getMyEvents);
router.get('/booked', authMiddleware, roleMiddleware(['fan']), getMyBookedEvents);
router.post('/', authMiddleware, roleMiddleware(['artist']), createEvent);
router.delete('/:id', authMiddleware, roleMiddleware(['artist']), deleteEvent);

module.exports = router;
