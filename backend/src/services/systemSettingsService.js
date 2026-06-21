import systemSettingsRepository from '../repositories/systemSettingsRepository.js';

class SystemSettingsService {
  async getSettings() {
    return await systemSettingsRepository.getSettings();
  }

  async saveSettings(settingsData) {
    return await systemSettingsRepository.saveSettings(settingsData);
  }
}

export default new SystemSettingsService();
