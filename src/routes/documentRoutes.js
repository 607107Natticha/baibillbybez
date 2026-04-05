const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');

// เพิ่ม authMiddleware คั่นไว้ก่อนเรียก Controller
router.get('/documents', authMiddleware, documentController.getDocuments);
router.post('/documents', authMiddleware, documentController.createDocument);
router.get('/documents/:id', authMiddleware, documentController.getDocumentById);
router.put('/documents/:id/status', authMiddleware, documentController.updateStatus);
router.delete('/documents/:id', authMiddleware, documentController.deleteDocument);

module.exports = router;