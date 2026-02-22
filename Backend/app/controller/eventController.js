const axios = require('axios');

const Artist = require('../model/artistModel');
const Venue = require('../model/venueModel');
const Event = require('../model/eventModel');
const { eventSchema } = require('../validation/eventValidation');

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

    const duplicateEvent = await Event.findOne({
      artistId: artist._id,
      venueId: venue._id,
      eventDate: new Date(eventDate),
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
    const { lat, lng, distance = 10 } = req.query;

    if ((lat && !lng) || (!lat && lng)) {
      return res.status(400).json({ message: 'Both lat and lng are required for location filtering' });
    }

    const populateOptions = [{ path: 'venueId' }, { path: 'artistId' }];

    if (lat && lng) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      const radiusInKm = Number(distance);

      if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radiusInKm) || radiusInKm <= 0) {
        return res.status(400).json({ message: 'lat, lng and distance must be valid numbers' });
      }

      const nearbyVenues = await Venue.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInKm * 1000,
          },
        },
      }).select('_id');

      const venueIds = nearbyVenues.map((venue) => venue._id);

      const nearbyEvents = await Event.find({ venueId: { $in: venueIds } }).populate(populateOptions);
      return res.status(200).json(nearbyEvents);
    }

    const events = await Event.find({}).populate(populateOptions);
    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

module.exports = {
  createEvent,
  getEvents,
};
