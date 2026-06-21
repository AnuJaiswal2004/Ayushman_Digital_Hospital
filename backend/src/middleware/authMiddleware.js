import { verifyAccessToken } from '../utils/tokenUtils.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyAccessToken(token);
      
      // Assign user details to request object
      req.user = decoded;
      return next();
    } catch (error) {
      console.error(`🔒 Authentication token failed: ${error.message}`);
      res.status(401);
      return next(new Error('Not authorized, token validation failed'));
    }
  }

  // Fallback: If in local storage / demo mode or developer testing without authorization header, we can handle it.
  // Wait, let's make it mandatory for backend routes unless health check is bypassed, but we can keep it strict.
  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, authorization header missing'));
  }
};
