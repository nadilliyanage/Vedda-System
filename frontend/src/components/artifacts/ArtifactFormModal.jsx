import { useState, useEffect } from 'react';
import { X, Upload, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createArtifactWithImage, updateArtifact, uploadImage, generateMetadata } from '../../services/artifactService';

const CATEGORIES = [
  { value: 'tools', label: 'Tools' },
  { value: 'pottery', label: 'Pottery' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'weapons', label: 'Weapons' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'other', label: 'Other' },
];

const ArtifactFormModal = ({ isOpen, onClose, onSuccess, artifact = null }) => {
  const isEditMode = !!artifact;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    location: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (artifact && isOpen) {
      setFormData({
        name: artifact.name || '',
        description: artifact.description || '',
        category: artifact.category || '',
        tags: artifact.tags?.join(', ') || '',
        location: artifact.location || '',
      });
      setImagePreview(artifact.imageUrl || artifact.images?.[0]?.url || null);
    }
  }, [artifact, isOpen]);

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
        // Generate metadata using Gemini AI
        const aiResult = await generateMetadata(uploadResult.data.url);
        
        setFormData((prev) => ({
          ...prev,
          name: aiResult.name || prev.name,
          description: aiResult.description || prev.description,
          category: aiResult.category || prev.category,
          tags: aiResult.tags?.join(', ') || prev.tags,
        }));
        
        toast.success('✨ AI-powered fields auto-filled! Review and adjust as needed.');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error(error.message || 'Failed to auto-fill fields. Please try again.');
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
    
    if (!imageFile && !isEditMode) {
      toast.error('Please upload an artifact image');
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        // Update existing artifact
        const updateData = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
        };

        // If new image is uploaded, handle it separately
        if (imageFile) {
          const uploadResult = await uploadImage(imageFile);
          if (uploadResult.success) {
            updateData.imageUrl = uploadResult.data.url;
            updateData.images = [{
              url: uploadResult.data.url,
              publicId: uploadResult.data.publicId,
              isPrimary: true
            }];
          }
        }

        const response = await updateArtifact(artifact._id, updateData);

        if (response.success) {
          toast.success('Artifact updated successfully!');
          onSuccess(response.data, true); // Pass true to indicate update
          handleClose();
        }
      } else {
        // Create new artifact
        const submitData = new FormData();
        submitData.append('image', imageFile);
        submitData.append('name', formData.name);
        submitData.append('description', formData.description);
        submitData.append('category', formData.category);
        submitData.append('location', formData.location);
        submitData.append('createdBy', 'admin'); // TODO: Get from auth context

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
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} artifact`);
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
    });
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Artifact' : 'Add New Artifact'}</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
          <div className="h-full flex gap-6 p-6">
            {/* Left Side - Image Upload */}
            <div className="w-2/5 flex flex-col">
              <div className="flex-1 bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Artifact Image {!isEditMode && '*'}
                </label>
                
                {imagePreview ? (
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain rounded-lg border"
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Remove Image
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        disabled={aiLoading}
                        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:bg-purple-300"
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
                  <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors rounded-lg">
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
            </div>

            {/* Right Side - Form Fields */}
            <div className="w-3/5 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={10}
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
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex justify-end gap-3">
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
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Artifact' : 'Create Artifact'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtifactFormModal;
