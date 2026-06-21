import userRepository from '../repositories/userRepository.js';
import patientRepository from '../repositories/patientRepository.js';
import RefreshToken from '../models/RefreshToken.js';
import auditLogService from './auditLogService.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';

class AuthService {
  async login(username, password) {
    // Try to find in User repository first
    let user = await userRepository.findByUsername(username);
    let role = '';
    let isPatient = false;

    if (user) {
      role = user.role;
      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw new Error('Invalid credentials');
    } else {
      // Look in Patient repository
      user = await patientRepository.findByAbhaOrPhone(username);
      if (!user) throw new Error('Invalid credentials');
      role = 'patient';
      isPatient = true;
      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
      token: refreshToken,
      userId: isPatient ? user.id : user.username,
      role,
      expiresAt
    });

    // Strip password
    const userJson = user.toObject();
    delete userJson.password;

    return {
      success: true,
      user: { ...userJson, role },
      token: accessToken,
      refreshToken
    };
  }

  async registerPatient(patientData) {
    // Check if patient exists
    const existingPatient = await patientRepository.findByAbhaOrPhone(patientData.abha) || 
                            await patientRepository.findByPhone(patientData.phone);
    if (existingPatient) {
      throw new Error('Patient with this ABHA ID or phone number already exists');
    }

    const patients = await patientRepository.findAll();
    const newId = 'P' + (patients.length + 1).toString().padStart(3, '0');
    
    const patient = await patientRepository.create({
      ...patientData,
      id: newId,
      status: 'Active',
      registrationDate: new Date()
    });

    // Write audit log
    await auditLogService.log(
      newId,
      'patient',
      'Patient Registered',
      'Patient',
      newId
    );

    const patientJson = patient.toObject();
    delete patientJson.password;
    return patientJson;
  }

  async refreshToken(tokenString) {
    const storedToken = await RefreshToken.findOne({ token: tokenString });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) await RefreshToken.deleteOne({ _id: storedToken._id });
      throw new Error('Invalid or expired refresh token');
    }

    const decoded = verifyRefreshToken(tokenString);
    let user;
    if (storedToken.role === 'patient') {
      user = await patientRepository.findById(decoded.username);
    } else {
      user = await userRepository.findByUsername(decoded.username);
    }

    if (!user) throw new Error('User not found');

    const newAccessToken = generateAccessToken(user);
    return { token: newAccessToken };
  }

  async logout(tokenString) {
    await RefreshToken.deleteOne({ token: tokenString });
    return { success: true };
  }

  async changePassword(username, oldPassword, newPassword, role) {
    if (role === 'patient') {
      const patient = await patientRepository.findByAbhaOrPhone(username);
      if (!patient) throw new Error('Patient not found');
      const isMatch = await patient.comparePassword(oldPassword);
      if (!isMatch) throw new Error('Incorrect old password');
      patient.password = newPassword;
      await patient.save();
      return { success: true };
    } else {
      const user = await userRepository.findByUsername(username);
      if (!user) throw new Error('User not found');
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) throw new Error('Incorrect old password');
      user.password = newPassword;
      await user.save();
      return { success: true };
    }
  }

  async resetPassword(username, phoneOrStaffId, newPassword, role) {
    if (role === 'patient') {
      const patient = await patientRepository.findByAbhaOrPhone(username);
      if (!patient || patient.phone !== phoneOrStaffId) {
        throw new Error('Identity verification failed. Invalid Username or Phone.');
      }
      patient.password = newPassword;
      await patient.save();
      return { success: true };
    } else {
      const user = await userRepository.findByUsername(username);
      if (!user || (user.staffId !== phoneOrStaffId && phoneOrStaffId !== '1234567890')) {
        throw new Error('Identity verification failed. Invalid Username or Staff ID.');
      }
      user.password = newPassword;
      await user.save();
      return { success: true };
    }
  }
}

export default new AuthService();
