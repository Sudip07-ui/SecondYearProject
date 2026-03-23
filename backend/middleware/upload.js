const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and PDF files are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

module.exports = upload;
