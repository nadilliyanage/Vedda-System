const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify JWT token and attach user info to request.
 * Extracts userId and role from token payload.
 */
module.exports = (req, res, next) => {
   try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required. No token provided.'
         });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach user info to request
      req.user = {
         id: decoded.userId,
         role: decoded.role || 'user',
         username: decoded.username || ''
      };

      next();
   } catch (error) {
      if (error.name === 'JsonWebTokenError') {
         return res.status(401).json({
            success: false,
            message: 'Invalid token'
         });
      }

      if (error.name === 'TokenExpiredError') {
         return res.status(401).json({
            success: false,
            message: 'Token expired'
         });
      }

      console.error('Auth middleware error:', error);
      res.status(500).json({
         success: false,
         message: 'Server error during authentication'
      });
   }
};
