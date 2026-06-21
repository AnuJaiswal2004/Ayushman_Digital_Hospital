import authService from '../services/authService.js';

class AuthController {
  async register(req, res, next) {
    try {
      const patient = await authService.registerPatient(req.body);
      res.status(201).json({ success: true, patient });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) throw new Error('Refresh token is required');
      const result = await authService.refreshToken(token);
      res.status(200).json(result);
    } catch (error) {
      res.status(401);
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { token } = req.body;
      await authService.logout(token);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { username, oldPassword, newPassword, role } = req.body;
      const result = await authService.changePassword(username, oldPassword, newPassword, role);
      res.status(200).json(result);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { username, phoneOrStaffId, newPassword, role } = req.body;
      const result = await authService.resetPassword(username, phoneOrStaffId, newPassword, role);
      res.status(200).json(result);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new AuthController();
