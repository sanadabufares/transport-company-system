const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[AUTH-ERROR] Authentication failed:', error);
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('[CheckRole] No user found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('[CheckRole] User role:', req.user.role, 'Required roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      console.log('[CheckRole] Role mismatch - User role:', req.user.role, 'does not match required roles:', roles);
      // Return 404 to obscure the existence of the endpoint for other roles
      return res.status(404).json({ message: 'Not Found' });
    }
    
    console.log('[CheckRole] Role check passed for user:', req.user.id);
    next();
  };
};

module.exports = { auth, checkRole };
