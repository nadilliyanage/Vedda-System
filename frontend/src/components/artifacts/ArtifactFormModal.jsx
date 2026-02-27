import { useState, useEffect } from 'react';
import { X, Upload, Sparkles, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createArtifactWithImage, updateArtifact, uploadImage, generateMetadata } from '../../services/artifactService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_ARTIFACT_SERVICE_URL || 'http://localhost:5010/api/artifacts';

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
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([]);
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
      // Load existing additional images (skip the primary one)
      const extras = (artifact.images || []).filter((img, i) => i > 0);
      setExistingAdditionalImages(extras);
    }
  }, [artifact, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImages = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === validFiles.length) {
          setAdditionalFiles((prev) => [...prev, ...validFiles]);
          setAdditionalPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset the input so the same files can be selected again
    e.target.value = '';
  };

  const removeAdditionalImage = (index) => {
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAdditionalImage = (index) => {
    setExistingAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoFill = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    setAiLoading(true);
    try {
      const uploadResult = await uploadImage(imageFile);
      
      if (uploadResult.success) {
        const aiResult = await generateMetadata(uploadResult.data.url);
        
        setFormData((prev) => ({
          ...prev,
          name: aiResult.name || prev.name,
          description: aiResult.description || prev.description,
          category: aiResult.category || prev.category,
          tags: aiResult.tags?.join(', ') || prev.tags,
          location: aiResult.suggestedLocation || prev.location,
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

  // Upload additional images and attach them to an artifact
  const uploadAndAttachAdditionalImages = async (artifactId, currentImages = []) => {
    if (additionalFiles.length === 0 && existingAdditionalImages.length === currentImages.length - 1) {
      return; // No changes to additional images
    }

    try {
      // Upload new additional images
      const uploadedImages = [];
      for (const file of additionalFiles) {
        const result = await uploadImage(file);
        if (result.success) {
          uploadedImages.push({
            url: result.data.url,
            publicId: result.data.publicId,
            isPrimary: false,
          });
        }
      }

      // Build the full images array: primary image + existing additional + newly uploaded
      const primaryImage = currentImages.find((img) => img.isPrimary) || currentImages[0];
      const allImages = [
        primaryImage,
        ...existingAdditionalImages,
        ...uploadedImages,
      ].filter(Boolean);

      // Update the artifact with the complete images array
      if (uploadedImages.length > 0 || existingAdditionalImages.length !== currentImages.length - 1) {
        await updateArtifact(artifactId, { images: allImages });
      }
    } catch (error) {
      console.error('Error uploading additional images:', error);
      toast.error('Some additional images failed to upload');
    }
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
        const updateData = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
        };

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
          // Handle additional images
          await uploadAndAttachAdditionalImages(artifact._id, response.data.images || artifact.images || []);
          toast.success('Artifact updated successfully!');
          onSuccess(response.data, true);
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
        submitData.append('createdBy', 'admin');

        if (formData.tags) {
          const tagsArray = formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
          submitData.append('tags', JSON.stringify(tagsArray));
        }

        const response = await createArtifactWithImage(submitData);

        if (response.success) {
          // Upload and attach additional images
          if (additionalFiles.length > 0) {
            await uploadAndAttachAdditionalImages(response.data._id, response.data.images || []);
          }
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
    setAdditionalFiles([]);
    setAdditionalPreviews([]);
    setExistingAdditionalImages([]);
    onClose();
  };

  const totalAdditionalImages = existingAdditionalImages.length + additionalPreviews.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-lg">
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
              <div className="flex-1 bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col min-h-0">
                <label className="block text-sm font-medium text-gray-700 mb-4 shrink-0">
                  Artifact Image {!isEditMode && '*'}
                </label>
                
                {imagePreview ? (
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 relative bg-white rounded-lg border overflow-hidden min-h-0">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-contain p-2"
                      />
                    </div>
                    <div className="flex flex-col gap-3 shrink-0">
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
                rows={6}
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

            {/* Additional Images */}
            <div className="col-span-2 mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Images ({totalAdditionalImages})
              </label>
              
              <div className="flex flex-wrap gap-3">
                {/* Existing additional images (edit mode) */}
                {existingAdditionalImages.map((img, i) => (
                  <div key={`existing-${i}`} className="relative w-20 h-20 rounded-lg border overflow-hidden group">
                    <img src={img.url} alt={`Additional ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingAdditionalImage(i)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}

                {/* New additional image previews */}
                {additionalPreviews.map((preview, i) => (
                  <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg border overflow-hidden group">
                    <img src={preview} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(i)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <Plus size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImages}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-2">You can add multiple additional images. Max 5MB each.</p>
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
