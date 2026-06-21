import fileRepository from '../repositories/fileRepository.js';
import auditLogService from './auditLogService.js';
import fs from 'fs';
import path from 'path';

class FileService {
  async registerFile(fileData, requestedBy = 'system', role = 'system') {
    const file = await fileRepository.create(fileData);
    
    await auditLogService.log(
      requestedBy,
      role,
      `File Registered: ${file.fileName}`,
      'File',
      file._id.toString()
    );

    return file;
  }

  async getFileById(id) {
    const file = await fileRepository.findById(id);
    if (!file) throw new Error('File not found');
    return file;
  }

  async getFilesByPatient(patientId) {
    return await fileRepository.findByPatientId(patientId);
  }

  async deleteFile(id, requestedBy = 'system', role = 'system') {
    const file = await fileRepository.findById(id);
    if (!file) throw new Error('File not found');

    // Remove file from uploads directory
    try {
      // The fileUrl will look like /uploads/filename.pdf. Let's delete the physical file
      const filename = path.basename(file.fileUrl);
      const filePath = path.join('backend/uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      }
    } catch (err) {
      console.error(`⚠️ Failed to remove physical file: ${err.message}`);
    }

    await fileRepository.deleteById(id);

    await auditLogService.log(
      requestedBy,
      role,
      `File Deleted: ${file.fileName}`,
      'File',
      id
    );

    return { success: true };
  }
}

export default new FileService();
