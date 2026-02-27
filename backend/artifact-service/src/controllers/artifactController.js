const Artifact = require('../models/Artifact');
const { uploadToCloudinary, deleteFromCloudinary, uploadMultipleToCloudinary } = require('../utils/cloudinaryHelper');
const { generateArtifactMetadata } = require('../services/aiService');

// Upload single image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const result = await uploadToCloudinary(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Upload multiple images
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image file'
      });
    }

    const results = await uploadMultipleToCloudinary(req.files);

    res.status(200).json({
      success: true,
      message: `${results.length} images uploaded successfully`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create artifact
exports.createArtifact = async (req, res) => {
  try {
    const artifact = new Artifact(req.body);
    await artifact.save();

    res.status(201).json({
      success: true,
      message: 'Artifact created successfully',
      data: artifact
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all artifacts with pagination and filtering
exports.getAllArtifacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (search) {
      // Use regex for partial matching on name, description, and tags
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const artifacts = await Artifact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Artifact.countDocuments(filter);

    res.status(200).json({
      success: true,
      artifacts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get artifact by ID
exports.getArtifactById = async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);

    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: 'Artifact not found'
      });
    }

    res.status(200).json({
      success: true,
      data: artifact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update artifact
exports.updateArtifact = async (req, res) => {
  try {
    const artifact = await Artifact.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: 'Artifact not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Artifact updated successfully',
      data: artifact
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete artifact
exports.deleteArtifact = async (req, res) => {
  try {
    const artifact = await Artifact.findByIdAndDelete(req.params.id);

    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: 'Artifact not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Artifact deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get artifacts by category
exports.getArtifactsByCategory = async (req, res) => {
  try {
    const artifacts = await Artifact.find({
      category: req.params.category
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: artifacts.length,
      data: artifacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create artifact with image upload
exports.createArtifactWithImage = async (req, res) => {
  try {
    let imageData = null;

    // Upload image if provided
    if (req.file) {
      imageData = await uploadToCloudinary(req.file.path);
    }

    // Parse JSON data from form-data
    const artifactData = {
      ...req.body,
      imageUrl: imageData ? imageData.url : undefined,
      images: imageData ? [{
        url: imageData.url,
        publicId: imageData.publicId,
        isPrimary: true
      }] : []
    };

    // Parse tags if sent as string
    if (typeof artifactData.tags === 'string') {
      artifactData.tags = JSON.parse(artifactData.tags);
    }

    const artifact = new Artifact(artifactData);
    await artifact.save();

    res.status(201).json({
      success: true,
      message: 'Artifact created successfully',
      data: artifact
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Generate AI metadata from image
exports.generateMetadata = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const metadata = await generateArtifactMetadata(imageUrl);

    res.status(200).json({
      success: true,
      message: 'Metadata generated successfully',
      data: {
        suggestedName: metadata.data.name,
        suggestedDescription: metadata.data.description,
        suggestedCategory: metadata.data.category,
        suggestedTags: metadata.data.tags,
        suggestedLocation: metadata.data.location,
        culturalSignificance: metadata.data.culturalSignificance
      }
    });
  } catch (error) {
    console.error('Generate metadata error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate metadata'
    });
  }
};
