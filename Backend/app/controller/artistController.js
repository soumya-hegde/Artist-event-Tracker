const Artist = require('../model/artistModel');
const { createArtistProfileSchema } = require('../validation/artistValidation');

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

module.exports = {
  createArtistProfile,
};
