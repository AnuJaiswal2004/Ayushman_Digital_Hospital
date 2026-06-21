import User from '../models/User.js';

class UserRepository {
  async findByUsername(username) {
    return await User.findOne({ username });
  }

  async findByStaffId(staffId) {
    return await User.findOne({ staffId });
  }

  async findById(id) {
    return await User.findById(id);
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async updatePassword(username, newPassword) {
    const user = await User.findOne({ username });
    if (!user) throw new Error('User not found');
    user.password = newPassword;
    return await user.save();
  }
}

export default new UserRepository();
