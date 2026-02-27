const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// All feedback routes require authentication
router.use(authMiddleware);

// User routes (any authenticated user)
router.post('/upload-images', upload.array('images', 5), feedbackController.uploadFeedbackImages);
router.post('/', feedbackController.submitFeedback);
router.get('/my', feedbackController.getMyFeedback);

// Admin/Elder (curator) routes
router.get('/stats', requireRole('admin', 'elder'), feedbackController.getFeedbackStats);
router.get('/', requireRole('admin', 'elder'), feedbackController.getAllFeedback);
router.get('/:id', requireRole('admin', 'elder'), feedbackController.getFeedbackById);
router.put('/:id/review', requireRole('admin', 'elder'), feedbackController.reviewFeedback);

module.exports = router;
