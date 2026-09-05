const express = require('express');
const router = express.Router();
const {
    uploadFile,
    uploadImage,
    getProjectFiles,
    downloadFile,
    deleteFile
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectParticipant } = require('../middleware/projectMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.post('/', upload.single('file'), requireProjectParticipant, uploadFile);
router.post('/upload', uploadImage);
router.get('/project/:projectId', requireProjectParticipant, getProjectFiles);
router.get('/:id/download', requireProjectParticipant, downloadFile);
router.delete('/:id', requireProjectParticipant, deleteFile);

module.exports = router;
