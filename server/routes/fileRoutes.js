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
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.post('/', upload.single('file'), uploadFile);
router.post('/upload', uploadImage);
router.get('/project/:projectId', getProjectFiles);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

module.exports = router;
