const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { upload, validateUploadContent } = require('../middleware/validateUpload.middleware');

// Upload routes (require authentication and upload permission)
router.post('/', 
  authMiddleware,
  roleMiddleware(['admin', 'creator']),
  upload.single('project'),
  validateUploadContent,
  uploadController.uploadProject
);

// Validation endpoint
router.post('/validate',
  authMiddleware,
  upload.single('project'),
  uploadController.validateUpload
);

module.exports = router;
