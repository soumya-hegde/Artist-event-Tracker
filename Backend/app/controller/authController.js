const jwt = require('jsonwebtoken');

const User = require('../model/userModel');
const { registerSchema, loginSchema } = require('../validation/authValidation');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ message });
    }

    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create(value);
    return res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ message });
    }

    const user = await User.findOne({ email: value.email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(value.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
};
