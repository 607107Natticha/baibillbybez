const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const singletonUserMiddleware = require('../middleware/singletonUserMiddleware');

router.get('/documents', singletonUserMiddleware, documentController.getDocuments);
router.post('/documents', singletonUserMiddleware, documentController.createDocument);
router.get('/documents/:id', singletonUserMiddleware, documentController.getDocumentById);
router.put('/documents/:id/status', singletonUserMiddleware, documentController.updateStatus);
router.delete('/documents/:id', singletonUserMiddleware, documentController.deleteDocument);

module.exports = router;