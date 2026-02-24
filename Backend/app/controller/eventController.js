const axios = require('axios');

const Artist = require('../model/artistModel');
const Venue = require('../model/venueModel');
const Event = require('../model/eventModel');
const Booking = require('../model/bookingModel');
const { eventSchema } = require('../validation/eventValidation');

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDayRange = (dateInput) => {
  const date = new Date(dateInput);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const geocodeAddress = async (fullAddress) => {
  const userAgent = process.env.NOMINATIM_USER_AGENT || 'artist-map-tracker/1.0 (contact@example.com)';
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q: fullAddress,
      format: 'jsonv2',
      limit: 1,
    },
    headers: {
      'User-Agent': userAgent,
      Accept: 'application/json',
    },
  });

  if (!Array.isArray(response.data) || response.data.length === 0) {
    throw new Error('Unable to geocode venue address');
  }

  const lat = Number(response.data[0].lat);
  const lng = Number(response.data[0].lon);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error('Invalid geocoding coordinates');
  }

  return { lat, lng };
};

const createEvent = async (req, res) => {
  try {
    const { error, value } = eventSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ message });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const artist = await Artist.findOne({ userId: req.user.id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }

    const { title, description, venueName, address, city, state, country, eventDate, startTime, endTime } =
      value;

    let venue = await Venue.findOne({ name: venueName, address });

    if (!venue) {
      const fullAddress = `${address}, ${city}, ${state}, ${country}`;
      const { lat, lng } = await geocodeAddress(fullAddress);

      venue = await Venue.create({
        name: venueName,
        address,
        city,
        state,
        country,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      });
    }

    const { start: dayStart, end: dayEnd } = getDayRange(eventDate);

    const occupiedEvent = await Event.findOne({
      venueId: venue._id,
      eventDate: { $gte: dayStart, $lt: dayEnd },
      artistId: { $ne: artist._id },
    });

    if (occupiedEvent) {
      return res.status(409).json({
        message: 'Venue is already occupied by another artist on this date',
      });
    }

    const duplicateEvent = await Event.findOne({
      artistId: artist._id,
      venueId: venue._id,
      eventDate: { $gte: dayStart, $lt: dayEnd },
    });

    if (duplicateEvent) {
      return res.status(400).json({ message: 'Duplicate event: same artist, venue and date already exists' });
    }

    const createdEvent = await Event.create({
      artistId: artist._id,
      venueId: venue._id,
      title,
      description,
      eventDate,
      startTime,
      endTime,
    });

    const populatedEvent = await Event.findById(createdEvent._id).populate('venueId');

    return res.status(201).json(populatedEvent);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getEvents = async (req, res) => {
  try {
    const { lat, lng, location, venue, venueName, q, distance = 10 } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    if ((lat && !lng) || (!lat && lng)) {
      return res.status(400).json({ message: 'Both lat and lng are required for location filtering' });
    }

    const populateOptions = [{ path: 'venueId' }, { path: 'artistId' }];

    const radiusInKm = Number(distance);
    if (Number.isNaN(radiusInKm) || radiusInKm <= 0) {
      return res.status(400).json({ message: 'distance must be a valid positive number' });
    }

    let venueQuery = {};

    const venueSearch = (venue || venueName || q || '').trim();
    if (venueSearch) {
      const venueRegex = new RegExp(escapeRegex(venueSearch), 'i');
      venueQuery = {
        ...venueQuery,
        $or: [
          { name: venueRegex },
          { address: venueRegex },
          { city: venueRegex },
          { state: venueRegex },
          { country: venueRegex },
        ],
      };
    }

    if (lat && lng) {
      const latitude = Number(lat);
      const longitude = Number(lng);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({ message: 'lat and lng must be valid numbers' });
      }

      venueQuery = {
        ...venueQuery,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInKm * 1000,
          },
        },
      };
    }

    if (location) {
      const { lat: geocodedLat, lng: geocodedLng } = await geocodeAddress(location);
      venueQuery = {
        ...venueQuery,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [geocodedLng, geocodedLat],
            },
            $maxDistance: radiusInKm * 1000,
          },
        },
      };
    }

    const hasVenueFilter = Object.keys(venueQuery).length > 0;
    const matchedVenues = hasVenueFilter ? await Venue.find(venueQuery).select('_id') : [];

    if (hasVenueFilter && matchedVenues.length === 0) {
      return res.status(200).json({
        events: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    const query = hasVenueFilter ? { venueId: { $in: matchedVenues.map((v) => v._id) } } : {};
    const total = await Event.countDocuments(query);
    const events = await Event.find(query).skip(skip).limit(limit).populate(populateOptions);
    return res.status(200).json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const artist = await Artist.findOne({ userId: req.user.id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }

    const query = { artistId: artist._id };
    const total = await Event.countDocuments(query);
    const myEvents = await Event.find(query)
      .skip(skip)
      .limit(limit)
      .populate([{ path: 'venueId' }, { path: 'artistId' }]);
    return res.status(200).json({
      events: myEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getMyBookedEvents = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const query = { fanId: req.user.id };
    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'eventId',
        populate: [{ path: 'venueId' }, { path: 'artistId' }],
      });

    const events = bookings
      .map((booking) => booking.eventId)
      .filter(Boolean);

    return res.status(200).json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const artist = await Artist.findOne({ userId: req.user.id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (String(event.artistId) !== String(artist._id)) {
      return res.status(403).json({ message: 'You are not allowed to delete this event' });
    }

    await Booking.deleteMany({ eventId: event._id });
    await Event.deleteOne({ _id: event._id });

    return res.status(200).json({ message: 'Event deleted successfully', eventId: String(event._id) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getMyEvents,
  getMyBookedEvents,
  deleteEvent,
};
