const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0];
    statusCode = 409;
    message = duplicateField
      ? `${duplicateField} already exists`
      : 'Duplicate key error';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((validationError) => validationError.message)
      .join(', ');
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  const response = {
    message,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
