const jwt = require('jsonwebtoken');

exports.generateToken = (userId, role = 'user', username = '') => {
  return jwt.sign(
    { userId, role, username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
