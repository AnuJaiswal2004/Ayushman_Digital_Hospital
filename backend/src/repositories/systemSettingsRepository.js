import SystemSettings from '../models/SystemSettings.js';

class SystemSettingsRepository {
  async getSettings() {
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      // Create defaults if not exists
      settings = new SystemSettings({});
      await settings.save();
    }
    return settings;
  }

  async saveSettings(settingsData) {
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = new SystemSettings(settingsData);
    } else {
      Object.assign(settings, settingsData);
    }
    return await settings.save();
  }
}

export default new SystemSettingsRepository();
