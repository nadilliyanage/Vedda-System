import { useState } from 'react';
import { X, Upload, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createArtifactWithImage, uploadImage, generateMetadata } from '../../services/artifactService';

const CATEGORIES = [
  { value: 'tools', label: 'Tools' },
  { value: 'pottery', label: 'Pottery' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'weapons', label: 'Weapons' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'other', label: 'Other' },
];

const ArtifactFormModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    location: '',
    dateFound: '',
    estimatedAge: '',
    status: 'draft',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoFill = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    setAiLoading(true);
    try {
      // First upload the image
      const uploadResult = await uploadImage(imageFile);
      
      if (uploadResult.success) {
        // Generate metadata using AI (placeholder for now)
        const aiResult = await generateMetadata(uploadResult.data.url);
        
        if (aiResult.success) {
          setFormData((prev) => ({
            ...prev,
            name: aiResult.data.suggestedName || prev.name,
            description: aiResult.data.suggestedDescription || prev.description,
            category: aiResult.data.suggestedCategory || prev.category,
            tags: aiResult.data.suggestedTags?.join(', ') || prev.tags,
          }));
          
          toast.success('✨ AI-powered fields auto-filled! Review and adjust as needed.');
        }
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('AI auto-fill coming soon! Please enter details manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast.error('Please upload an artifact image');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('image', imageFile);
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('location', formData.location);
      submitData.append('status', formData.status);
      submitData.append('createdBy', 'admin'); // TODO: Get from auth context

      if (formData.dateFound) {
        submitData.append('dateFound', formData.dateFound);
      }
      if (formData.estimatedAge) {
        submitData.append('estimatedAge', formData.estimatedAge);
      }
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        submitData.append('tags', JSON.stringify(tagsArray));
      }

      const response = await createArtifactWithImage(submitData);

      if (response.success) {
        toast.success('Artifact created successfully!');
        onSuccess(response.data);
        handleClose();
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to create artifact');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      tags: '',
      location: '',
      dateFound: '',
      estimatedAge: '',
      status: 'draft',
    });
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add New Artifact</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Image Upload Section */}
          <div className="mb-6 bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artifact Image *
            </label>
            
            {imagePreview ? (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg border"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Remove Image
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={aiLoading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:bg-purple-300"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Fill Details Auto
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-64 cursor-pointer hover:bg-gray-100 transition-colors rounded-lg">
                <Upload size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg mb-2">Click to upload artifact image</p>
                <p className="text-gray-400 text-sm">PNG, JPG, WEBP up to 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artifact Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter artifact name"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter detailed description"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Where was it found?"
              />
            </div>

            {/* Date Found */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Found
              </label>
              <input
                type="date"
                name="dateFound"
                value={formData.dateFound}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Estimated Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Age
              </label>
              <input
                type="text"
                name="estimatedAge"
                value={formData.estimatedAge}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2000 years old"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., traditional, ancient, vedda"
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-300"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Artifact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtifactFormModal;
