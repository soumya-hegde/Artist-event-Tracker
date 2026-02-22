const Joi = require('joi');

const createArtistProfileSchema = Joi.object({
  stageName: Joi.string().trim().required(),
  bio: Joi.string().trim().max(500).allow('').optional(),
  city: Joi.string().trim().required(),
  socialLinks: Joi.object({
    instagram: Joi.string().trim().allow('').optional(),
    youtube: Joi.string().trim().allow('').optional(),
  })
    .optional()
    .default({}),
});

module.exports = {
  createArtistProfileSchema,
};
