import Doctor from '../models/Doctor.js';

class DoctorRepository {
  async findAll() {
    return await Doctor.find({});
  }

  async findById(id) {
    return await Doctor.findOne({ id });
  }

  async findByName(name) {
    return await Doctor.findOne({ name });
  }

  async create(doctorData) {
    const doctor = new Doctor(doctorData);
    return await doctor.save();
  }

  async updateAvailability(id, status) {
    return await Doctor.findOneAndUpdate(
      { id },
      { $set: { status } },
      { new: true }
    );
  }
}

export default new DoctorRepository();
