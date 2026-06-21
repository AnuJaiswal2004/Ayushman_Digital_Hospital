import FileModel from '../models/File.js';

class FileRepository {
  async create(fileData) {
    const file = new FileModel(fileData);
    return await file.save();
  }

  async findById(id) {
    return await FileModel.findById(id);
  }

  async findByPatientId(patientId) {
    return await FileModel.find({ patientId }).sort({ uploadedAt: -1 });
  }

  async deleteById(id) {
    return await FileModel.findByIdAndDelete(id);
  }
}

export default new FileRepository();
