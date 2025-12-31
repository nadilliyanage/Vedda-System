const express = require('express');
const router = express.Router();
const artifactController = require('../controllers/artifactController');
const upload = require('../middleware/upload');

// Image upload routes
router.post('/upload/single', upload.single('image'), artifactController.uploadImage);
router.post('/upload/multiple', upload.array('images', 5), artifactController.uploadMultipleImages);

// Create artifact with image
router.post('/with-image', upload.single('image'), artifactController.createArtifactWithImage);

// CRUD routes
router.post('/', artifactController.createArtifact);
router.get('/', artifactController.getAllArtifacts);
router.get('/:id', artifactController.getArtifactById);
router.put('/:id', artifactController.updateArtifact);
router.delete('/:id', artifactController.deleteArtifact);

// Additional routes
router.get('/category/:category', artifactController.getArtifactsByCategory);

// AI metadata generation
router.post('/generate-metadata', artifactController.generateMetadata);

module.exports = router;
