const mongoose = require('mongoose');

const artifactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Artifact name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['tools', 'pottery', 'jewelry', 'weapons', 'clothing', 'other'],
      default: 'other'
    },
    tags: [{
      type: String,
      trim: true
    }],
    location: {
      type: String,
      trim: true
    },
    dateFound: {
      type: Date
    },
    estimatedAge: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String
    },
    images: [{
      url: String,
      publicId: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    metadata: {
      aiGenerated: {
        type: Boolean,
        default: false
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100
      },
      detectedObjects: [{
        label: String,
        confidence: Number
      }],
      extractedText: String
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for search optimization
artifactSchema.index({ name: 'text', description: 'text', tags: 'text' });
artifactSchema.index({ category: 1 });
artifactSchema.index({ status: 1 });

module.exports = mongoose.model('Artifact', artifactSchema);