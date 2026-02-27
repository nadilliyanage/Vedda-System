const Feedback = require('../models/Feedback');
const Artifact = require('../models/Artifact');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');

// Submit feedback for an artifact (any authenticated user)
exports.submitFeedback = async (req, res) => {
   try {
      const { artifactId, feedbackType, suggestedChanges, suggestedImages, username } = req.body;

      // Validate artifact exists
      const artifact = await Artifact.findById(artifactId);
      if (!artifact) {
         return res.status(404).json({
            success: false,
            message: 'Artifact not found'
         });
      }

      // Validate that at least some change, info, or images are provided
      const hasChanges = suggestedChanges && Object.keys(suggestedChanges).length > 0;
      const hasImages = suggestedImages && suggestedImages.length > 0;
      if (!hasChanges && !hasImages) {
         return res.status(400).json({
            success: false,
            message: 'Please provide at least one suggested change, image, or additional information'
         });
      }

      const feedback = new Feedback({
         artifactId,
         userId: req.user.id,
         username: username || req.user.username || 'Anonymous',
         feedbackType,
         suggestedChanges,
         suggestedImages: suggestedImages || []
      });

      await feedback.save();

      res.status(201).json({
         success: true,
         message: 'Feedback submitted successfully. It will be reviewed by a curator.',
         data: feedback
      });
   } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(400).json({
         success: false,
         message: error.message
      });
   }
};

// Upload images for feedback (any authenticated user)
exports.uploadFeedbackImages = async (req, res) => {
   try {
      if (!req.files || req.files.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'Please upload at least one image'
         });
      }

      const uploadResults = [];
      for (const file of req.files) {
         const result = await uploadToCloudinary(file.path, 'vedda-feedback');
         uploadResults.push({
            url: result.url,
            publicId: result.publicId
         });
      }

      res.status(200).json({
         success: true,
         message: `${uploadResults.length} image(s) uploaded successfully`,
         data: uploadResults
      });
   } catch (error) {
      console.error('Upload feedback images error:', error);
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};

// Get all feedback with filters (admin/elder only)
exports.getAllFeedback = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 20,
         status,
         feedbackType,
         artifactId
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (feedbackType) filter.feedbackType = feedbackType;
      if (artifactId) filter.artifactId = artifactId;

      const skip = (page - 1) * limit;

      const feedback = await Feedback.find(filter)
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit))
         .populate('artifactId', 'name category imageUrl');

      const total = await Feedback.countDocuments(filter);

      res.status(200).json({
         success: true,
         feedback,
         pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
         }
      });
   } catch (error) {
      console.error('Get all feedback error:', error);
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};

// Get single feedback detail (admin/elder only)
exports.getFeedbackById = async (req, res) => {
   try {
      const feedback = await Feedback.findById(req.params.id)
         .populate('artifactId');

      if (!feedback) {
         return res.status(404).json({
            success: false,
            message: 'Feedback not found'
         });
      }

      res.status(200).json({
         success: true,
         data: feedback
      });
   } catch (error) {
      console.error('Get feedback by ID error:', error);
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};

// Review feedback - approve or reject (admin/elder only)
// When approved, suggested changes are automatically applied to the artifact
exports.reviewFeedback = async (req, res) => {
   try {
      const { status, reviewNote } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
         return res.status(400).json({
            success: false,
            message: 'Status must be either "approved" or "rejected"'
         });
      }

      const feedback = await Feedback.findById(req.params.id);

      if (!feedback) {
         return res.status(404).json({
            success: false,
            message: 'Feedback not found'
         });
      }

      if (feedback.status !== 'pending') {
         return res.status(400).json({
            success: false,
            message: `Feedback has already been ${feedback.status}`
         });
      }

      // If approved, automatically apply suggested changes to the artifact
      let updatedArtifact = null;
      if (status === 'approved') {
         const changes = {};
         const sc = feedback.suggestedChanges || {};
         if (sc.name) changes.name = sc.name;
         if (sc.description) changes.description = sc.description;
         if (sc.category) changes.category = sc.category;
         if (sc.tags && sc.tags.length > 0) changes.tags = sc.tags;
         if (sc.location) changes.location = sc.location;

         // Apply suggested images — add to the artifact's images array
         const updateOps = {};
         if (Object.keys(changes).length > 0) {
            updateOps.$set = changes;
         }
         if (feedback.suggestedImages && feedback.suggestedImages.length > 0) {
            const newImages = feedback.suggestedImages.map(img => ({
               url: img.url,
               publicId: img.publicId || '',
               isPrimary: false
            }));
            // Set the main imageUrl if artifact doesn't have one
            const artifact = await Artifact.findById(feedback.artifactId);
            if (artifact && !artifact.imageUrl) {
               updateOps.$set = updateOps.$set || {};
               updateOps.$set.imageUrl = newImages[0].url;
            }
            updateOps.$push = { images: { $each: newImages } };
         }

         if (Object.keys(updateOps).length > 0) {
            updatedArtifact = await Artifact.findByIdAndUpdate(
               feedback.artifactId,
               updateOps,
               { new: true, runValidators: true }
            );
         }
      }

      feedback.status = status;
      feedback.reviewedBy = req.user.id;
      feedback.reviewNote = reviewNote || '';
      feedback.reviewedAt = new Date();

      await feedback.save();

      res.status(200).json({
         success: true,
         message: status === 'approved'
            ? 'Feedback approved and changes applied to artifact'
            : 'Feedback rejected',
         data: feedback,
         updatedArtifact
      });
   } catch (error) {
      console.error('Review feedback error:', error);
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};

// Get current user's own feedback
exports.getMyFeedback = async (req, res) => {
   try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const feedback = await Feedback.find({ userId: req.user.id })
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit))
         .populate('artifactId', 'name category imageUrl');

      const total = await Feedback.countDocuments({ userId: req.user.id });

      res.status(200).json({
         success: true,
         feedback,
         pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
         }
      });
   } catch (error) {
      console.error('Get my feedback error:', error);
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};

// Get feedback statistics (admin/elder only)
exports.getFeedbackStats = async (req, res) => {
   try {
      const [statusCounts, typeCounts, totalCount, recentCount] = await Promise.all([
         // Count by status
         Feedback.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
         ]),
         // Count by type
         Feedback.aggregate([
            { $group: { _id: '$feedbackType', count: { $sum: 1 } } }
         ]),
         // Total count
         Feedback.countDocuments({}),
         // Recent (last 7 days)
         Feedback.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
         })
      ]);

      const stats = {
         total: totalCount,
         recentWeek: recentCount,
         byStatus: {
            pending: 0,
            approved: 0,
            rejected: 0
         },
         byType: {
            edit_suggestion: 0,
            new_info: 0,
            correction: 0,
            general: 0
         }
      };

      statusCounts.forEach(s => {
         if (stats.byStatus.hasOwnProperty(s._id)) {
            stats.byStatus[s._id] = s.count;
         }
      });

      typeCounts.forEach(t => {
         if (stats.byType.hasOwnProperty(t._id)) {
            stats.byType[t._id] = t.count;
         }
      });

      res.status(200).json({
         success: true,
         data: stats
      });
   } catch (error) {
      console.error('Get feedback stats error:', error);
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};
