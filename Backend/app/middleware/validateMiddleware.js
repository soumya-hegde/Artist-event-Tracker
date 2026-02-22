const validateMiddleware = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    return res.status(400).json({ message });
  }

  req.body = value;
  next();
};

module.exports = validateMiddleware;
