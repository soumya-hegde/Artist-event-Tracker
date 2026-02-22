const Joi = require('joi');

const eventSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().allow('').optional(),
  venueName: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  eventDate: Joi.date().required(),
  startTime: Joi.string().trim().required(),
  endTime: Joi.string().trim().required(),
});

module.exports = {
  eventSchema,
};
