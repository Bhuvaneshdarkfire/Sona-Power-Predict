// ─── Submissions Routes ─────────────────────────────────────────
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyTeamMember } = require('../middleware/authMiddleware');
const {
    uploadSubmission,
    getSubmissions,
    getSubmissionStatus,
} = require('../controllers/submissionController');

const router = express.Router();

// Configure multer for .zip uploads (5 MB max for mymodelfile.py)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.zip') {
            return cb(new Error('Only .zip files are allowed'));
        }
        cb(null, true);
    },
});

// ─── Upload Schedule (public, no auth needed) ────────────────
const { getSchedule, isUploadWindowOpen } = require('../config/uploadSchedule');

router.get('/schedule', (req, res) => {
    try {
        const schedule = getSchedule();
        const windowStatus = isUploadWindowOpen();
        res.json({
            schedule,
            isOpen: windowStatus.open,
            message: windowStatus.message,
            currentWindow: windowStatus.currentWindow,
            nextWindow: windowStatus.nextWindow,
        });
    } catch (err) {
        console.error('Schedule error:', err);
        res.status(500).json({ error: 'Failed to get upload schedule' });
    }
});

// Routes
router.post('/upload', verifyTeamMember, upload.single('file'), uploadSubmission);
router.get('/status/:submissionId', verifyTeamMember, getSubmissionStatus);
router.get('/:teamId', verifyTeamMember, getSubmissions);

module.exports = router;
