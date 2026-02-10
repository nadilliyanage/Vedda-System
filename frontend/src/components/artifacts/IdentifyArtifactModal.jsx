import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Upload, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { identifyArtifact } from '../../services/artifactService';
import { translateWord } from '../../services/dictionaryService';

const IdentifyArtifactModal = ({ isOpen, onClose }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [identifiedData, setIdentifiedData] = useState(null);

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
      setIdentifiedData(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentify = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    setLoading(true);
    try {
      const result = await identifyArtifact(imageFile);
      
      // Check if confidence is below 60%
      if (result.confidence < 0.6) {
        setIdentifiedData({
          notIdentified: true,
          confidence: result.confidence,
          all_predictions: result.all_predictions
        });
        toast.error('⚠️ Artifact could not be identified with sufficient confidence');
        return;
      }
      
      // Parse tags if it's a string
      const tags = typeof result.tags === 'string' 
        ? result.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : result.tags || [];
      
      // Try to get Vedda translation for the artifact name
      let veddaWord = null;
      
      // Try exact match first
      try {
        const translation = await translateWord(result.artifact_name, 'english', 'vedda');
        
        if (translation.success && translation.translation) {
          veddaWord = translation.translation;
        }
      } catch (error) {
        console.error('Exact match not found, trying alternatives...');
      }
      
      // If no exact match, try removing "vedda" prefix and search for the base word
      if (!veddaWord) {
        const artifactNameLower = result.artifact_name.toLowerCase();
        const words = artifactNameLower.split(' ').filter(w => w !== 'vedda');
        
        if (words.length > 0) {
          const baseWord = words.join(' ');
          
          try {
            const translation = await translateWord(baseWord, 'english', 'vedda');
            
            if (translation.success && translation.translation) {
              veddaWord = translation.translation;
            }
          } catch (error) {
            console.error('Base word not found, trying individual words...');
          }
        }
        
        // If still no match, try each individual word
        if (!veddaWord && words.length > 1) {
          for (const word of words) {
            try {
              const translation = await translateWord(word, 'english', 'vedda');
              if (translation.success && translation.translation) {
                veddaWord = translation.translation;
                break;
              }
            } catch (error) {
              console.error(`Word "${word}" not found, continuing...`);
            }
          }
        }
      }
      
      if (!veddaWord) {
        console.log('No Vedda translation found for:', result.artifact_name);
      }
      
      setIdentifiedData({
        name: result.artifact_name,
        veddaWord: veddaWord,
        description: result.description,
        category: result.category,
        tags: tags,
        confidence: result.confidence,
        all_predictions: result.all_predictions
      });
      
      toast.success('✨ Artifact identified successfully!');
    } catch (error) {
      console.error('Identification error:', error);
      toast.error(error.message || 'Failed to identify artifact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImageFile(null);
    setImagePreview(null);
    setIdentifiedData(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <h2 className="text-2xl font-bold text-white">Identify Artifact</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Image Upload */}
            <div>
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 h-full min-h-[400px] flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Upload Artifact Image
                </label>
                
                {imagePreview ? (
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 flex items-center justify-center bg-white rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setIdentifiedData(null);
                        }}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                      >
                        Remove Image
                      </button>
                      <button
                        type="button"
                        onClick={handleIdentify}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            Identifying...
                          </>
                        ) : (
                          <>
                            <Sparkles size={20} />
                            Identify Artifact
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors rounded-lg">
                    <Upload size={64} className="text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg mb-2 font-medium">Click to upload artifact image</p>
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

            {/* Right Side - Identification Results */}
            <div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 h-full min-h-[400px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={20} />
                  Identification Results
                </h3>

                {identifiedData ? (
                  identifiedData.notIdentified ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center bg-white rounded-xl p-8">
                        <div className="text-6xl mb-4">❌</div>
                        <h3 className="text-xl font-bold text-red-600 mb-2">Artifact Not Identified</h3>
                        <p className="text-gray-600 mb-4">
                          The confidence level is too low to accurately identify this artifact.
                        </p>
                        <div className="bg-red-50 rounded-lg p-4 mb-4">
                          <p className="text-sm text-red-800 font-medium">
                            Confidence: {(identifiedData.confidence * 100).toFixed(1)}% (Minimum: 60%)
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          Try uploading a clearer image with better lighting and focus.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                    {/* Name with Confidence */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                        Artifact Name
                      </label>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-gray-800 capitalize">{identifiedData.name}</p>
                          {identifiedData.veddaWord && (
                            <p className="text-md text-purple-600 font-semibold mt-1">
                              {identifiedData.veddaWord} <span className="text-xs text-gray-500">(Vedda)</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                          <TrendingUp size={14} />
                          <span className="text-sm font-semibold">
                            {(identifiedData.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                        Category
                      </label>
                      <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                        {identifiedData.category}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                        Description
                      </label>
                      <p className="text-gray-700 leading-relaxed">{identifiedData.description}</p>
                    </div>

                    {/* Tags */}
                    {identifiedData.tags && identifiedData.tags.length > 0 && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {identifiedData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-gray-600 text-lg mb-2">Upload an image to identify</p>
                      <p className="text-gray-400 text-sm">
                        Our AI will analyze the artifact and provide detailed information
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            💡 <span className="font-medium">Tip:</span> Upload clear, well-lit images for best results
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

IdentifyArtifactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default IdentifyArtifactModal;
