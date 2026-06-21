import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ayushman_jwt_secret_key_123_456';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ayushman_jwt_refresh_secret_key_789_012';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, username: user.username || user.abha, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, username: user.username || user.abha, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
