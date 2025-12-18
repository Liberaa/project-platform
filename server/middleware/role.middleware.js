const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Additional check for upload permission
    if (req.path.includes('upload') && !req.user.canUpload && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Upload permission required' });
    }

    next();
  };
};

module.exports = roleMiddleware;
