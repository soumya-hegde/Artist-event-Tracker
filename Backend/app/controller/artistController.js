const Artist = require('../model/artistModel');
const { createArtistProfileSchema } = require('../validation/artistValidation');

const getMyArtistProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const artist = await Artist.findOne({ userId: req.user.id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }

    return res.status(200).json(artist);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const createArtistProfile = async (req, res) => {
  try {
    const { error, value } = createArtistProfileSchema.validate(req.body, {
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

    const existingProfile = await Artist.findOne({ userId: req.user.id });
    if (existingProfile) {
      return res.status(409).json({ message: 'Artist profile already exists' });
    }

    const artist = await Artist.create({
      userId: req.user.id,
      ...value,
    });

    return res.status(201).json({
      message: 'Artist profile created successfully',
      artist,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const updateArtistProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { error, value } = createArtistProfileSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ message });
    }

    const artist = await Artist.findOne({ userId: req.user.id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }

    artist.stageName = value.stageName;
    artist.bio = value.bio;
    artist.city = value.city;
    artist.socialLinks = value.socialLinks || {};

    await artist.save();

    return res.status(200).json({
      message: 'Artist profile updated successfully',
      artist,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

module.exports = {
  getMyArtistProfile,
  createArtistProfile,
  updateArtistProfile,
};
