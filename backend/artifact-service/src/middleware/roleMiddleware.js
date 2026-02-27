/**
 * Middleware factory to restrict access by user role.
 * Usage: requireRole('admin', 'elder')
 * Must be used after authMiddleware (requires req.user).
 */
const requireRole = (...allowedRoles) => {
   return (req, res, next) => {
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      if (!allowedRoles.includes(req.user.role)) {
         return res.status(403).json({
            success: false,
            message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
         });
      }

      next();
   };
};

module.exports = requireRole;
