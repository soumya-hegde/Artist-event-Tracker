const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('artist', 'fan').default('fan'),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const validateRegister = (data) =>
  registerSchema.validate(data, { abortEarly: false, stripUnknown: true });

const validateLogin = (data) =>
  loginSchema.validate(data, { abortEarly: false, stripUnknown: true });

module.exports = {
  validateRegister,
  validateLogin,
};
