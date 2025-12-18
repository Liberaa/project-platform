const multer = require('multer');
const path = require('path');

// Memory storage (good choice)
const storage = multer.memoryStorage();

// Much more tolerant ZIP detection
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === '.zip') {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.originalname}. Please upload a ZIP file.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024
  }
});

const validateUploadContent = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded. Please select a ZIP file.'
    });
  }

  next();
};

module.exports = {
  upload,
  validateUploadContent
};
