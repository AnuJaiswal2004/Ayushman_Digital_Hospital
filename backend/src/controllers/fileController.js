import fileService from '../services/fileService.js';
import multer from 'multer';
import path from 'path';

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to the uploads directory in root or backend/uploads
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

class FileController {
  // Expose the multer middleware directly
  get uploadMiddleware() {
    return uploadMiddleware.single('file');
  }

  async upload(req, res, next) {
    try {
      if (!req.file) {
        throw new Error('Please select a file to upload');
      }

      const actor = req.user ? req.user.username : 'system';
      const role = req.user ? req.user.role : 'system';

      const fileData = {
        fileName: req.file.originalname,
        fileType: path.extname(req.file.originalname),
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileUrl: `/uploads/${req.file.filename}`,
        patientId: req.body.patientId,
        visitId: req.body.visitId || '',
        uploadedBy: actor,
        category: req.body.category || 'OTHER'
      };

      const fileRecord = await fileService.registerFile(fileData, actor, role);
      res.status(201).json({ success: true, file: fileRecord });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const fileRecord = await fileService.getFileById(req.params.id);
      res.status(200).json({ success: true, file: fileRecord });
    } catch (error) {
      res.status(404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'system';
      const role = req.user ? req.user.role : 'system';
      const result = await fileService.deleteFile(req.params.id, actor, role);
      res.status(200).json(result);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new FileController();
