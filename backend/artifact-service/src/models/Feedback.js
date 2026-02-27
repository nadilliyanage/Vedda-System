const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
   {
      artifactId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Artifact',
         required: [true, 'Artifact ID is required']
      },
      userId: {
         type: String,
         required: [true, 'User ID is required']
      },
      username: {
         type: String,
         required: [true, 'Username is required'],
         trim: true
      },
      feedbackType: {
         type: String,
         required: [true, 'Feedback type is required'],
         enum: ['edit_suggestion', 'new_info', 'correction', 'general']
      },
      status: {
         type: String,
         enum: ['pending', 'approved', 'rejected'],
         default: 'pending'
      },
      suggestedChanges: {
         name: { type: String, trim: true },
         description: { type: String, trim: true },
         category: {
            type: String,
            enum: ['tools', 'pottery', 'jewelry', 'weapons', 'clothing', 'other', '']
         },
         tags: [{ type: String, trim: true }],
         location: { type: String, trim: true },
         additionalInfo: { type: String, trim: true }
      },
      // Suggested images uploaded by the user
      suggestedImages: [{
         url: { type: String, required: true },
         publicId: { type: String }
      }],
      // Curator review fields
      reviewedBy: { type: String },
      reviewNote: { type: String, trim: true },
      reviewedAt: { type: Date }
   },
   {
      timestamps: true
   }
);

// Indexes for efficient querying
feedbackSchema.index({ artifactId: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
