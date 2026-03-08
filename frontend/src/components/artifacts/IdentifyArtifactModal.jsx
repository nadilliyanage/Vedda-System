import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Upload, Sparkles, Loader2, TrendingUp, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { identifyArtifact } from '../../services/artifactService';
import { translateWord } from '../../services/dictionaryService';
import { modelAPI } from '../../services/modelAPI';

const IdentifyArtifactModal = ({ isOpen, onClose }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [identifiedData, setIdentifiedData] = useState(null);
  const navigate = useNavigate();

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

      // Try to get 3D word data for pronunciation navigation
      let veddaWordData = null;
      if (veddaWord) {
        try {
          const wordResponse = await modelAPI.getWordByVedda(veddaWord);
          const item = wordResponse.data?.data || wordResponse.data;
          if (item && (item.id || item._id)) {
            veddaWordData = {
              id: item._id || item.id,
              word: item.vedda_word || '',
              ipa: (item.vedda_ipa || '').replace(/^\/|\/$/g, ''),
              sinhalaWord: item.sinhala_word || '',
              englishWord: item.english_word || '',
            };
          }
        } catch (_) { /* no 3D data available */ }
      }
      
      setIdentifiedData({
        name: result.artifact_name,
        veddaWord: veddaWord,
        veddaWordData: veddaWordData,
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
      <div 
        className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          background: "rgba(255,248,230,0.55)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(200,165,90,0.30)"
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <h2 className="text-2xl font-bold text-white">Identify Artifact</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-black/10 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Image Upload */}
            <div>
              <div 
                className="rounded-xl border-2 border-dashed p-6 h-full min-h-[400px] flex flex-col"
                style={{
                  background: "rgba(255,248,230,0.35)",
                  borderColor: "rgba(200,165,90,0.35)"
                }}
              >
                <label className="block text-sm font-medium mb-4" style={{ color: "#5c4a1e" }}>
                  Upload Artifact Image
                </label>
                
                {imagePreview ? (
                  <div className="flex-1 flex flex-col gap-4">
                    <div 
                      className="flex items-center justify-center rounded-lg overflow-hidden w-full h-64"
                      style={{ background: "rgba(255,248,230,0.65)" }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
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
                        className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium"
                        style={{
                          background: "rgba(220,100,100,0.15)",
                          color: "#c44545",
                          border: "1px solid rgba(220,100,100,0.25)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220,100,100,0.25)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(220,100,100,0.15)"}
                      >
                        Remove Image
                      </button>
                      <button
                        type="button"
                        onClick={handleIdentify}
                        disabled={loading}
                        className="flex-1 px-4 py-3 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
                        style={{
                          background: "linear-gradient(135deg, #7c3fa8, #4a6fa8)",
                          boxShadow: "0 4px 12px rgba(124,63,168,0.30)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 16px rgba(124,63,168,0.40)"}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,63,168,0.30)"}
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
                  <label className="flex-1 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-colors" style={{ color: "#5c4a1e" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(200,165,90,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <Upload size={64} className="mb-4" />
                    <p className="text-lg mb-2 font-medium">Click to upload artifact image</p>
                    <p className="text-sm" style={{ color: "#7c6a47" }}>PNG, JPG, WEBP up to 5MB</p>
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
              <div 
                className="rounded-xl p-6 h-full min-h-[400px]"
                style={{
                  background: "rgba(255,248,230,0.80)",
                  border: "1px solid rgba(200,165,90,0.22)"
                }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1c1409" }}>
                  <Sparkles style={{ color: "#7c3fa8" }} size={20} />
                  Identification Results
                </h3>

                {identifiedData ? (
                  identifiedData.notIdentified ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center rounded-xl p-8" style={{ background: "rgba(255,248,230,0.70)" }}>
                        <div className="text-6xl mb-4">❌</div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: "#c44545" }}>Artifact Not Identified</h3>
                        <p className="mb-4" style={{ color: "#3d2e0f" }}>
                          The confidence level is too low to accurately identify this artifact.
                        </p>
                        <div className="rounded-lg p-4 mb-4" style={{ background: "rgba(196,69,69,0.10)", border: "1px solid rgba(196,69,69,0.20)" }}>
                          <p className="text-sm font-medium" style={{ color: "#c44545" }}>
                            Confidence: {(identifiedData.confidence * 100).toFixed(1)}% (Minimum: 60%)
                          </p>
                        </div>
                        <p className="text-sm" style={{ color: "#7c6a47" }}>
                          Try uploading a clearer image with better lighting and focus.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                    {/* Name with Confidence */}
                    <div 
                      className="rounded-lg p-4 shadow-sm border"
                      style={{
                        background: "rgba(255,248,230,0.20)",
                        borderColor: "rgba(200,165,90,0.20)"
                      }}
                    >
                      <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: "#7c6a47" }}>
                        Artifact Name
                      </label>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold capitalize" style={{ color: "#1c1409" }}>{identifiedData.name}</p>
                          {identifiedData.veddaWord && (
                            <p className="text-md font-semibold mt-1" style={{ color: "#7c3fa8" }}>
                              {identifiedData.veddaWord} <span className="text-xs" style={{ color: "#7c6a47" }}>(Vedda)</span>
                            </p>
                          )}
                        </div>
                        <div 
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            color: "#2d7a3e",
                            background: "rgba(61,153,87,0.15)",
                            border: "1px solid rgba(61,153,87,0.25)"
                          }}
                        >
                          <TrendingUp size={14} />
                          <span>
                            {(identifiedData.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Category */}
                    <div 
                      className="rounded-lg p-4 shadow-sm border"
                      style={{
                        background: "rgba(255,248,230,0.20)",
                        borderColor: "rgba(200,165,90,0.20)"
                      }}
                    >
                      <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: "#7c6a47" }}>
                        Category
                      </label>
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium capitalize"
                        style={{
                          color: "#7c3fa8",
                          background: "rgba(124,63,168,0.12)",
                          border: "1px solid rgba(124,63,168,0.20)"
                        }}
                      >
                        {identifiedData.category}
                      </span>
                    </div>

                    {/* Description */}
                    <div 
                      className="rounded-lg p-4 shadow-sm border"
                      style={{
                        background: "rgba(255,248,230,0.20)",
                        borderColor: "rgba(200,165,90,0.20)"
                      }}
                    >
                      <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#7c6a47" }}>
                        Description
                      </label>
                      <p className="leading-relaxed" style={{ color: "#3d2e0f" }}>{identifiedData.description}</p>
                    </div>

                    {/* Tags */}
                    {identifiedData.tags && identifiedData.tags.length > 0 && (
                      <div 
                        className="rounded-lg p-4 shadow-sm border"
                        style={{
                          background: "rgba(255,248,230,0.65)",
                          borderColor: "rgba(200,165,90,0.20)"
                        }}
                      >
                        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#7c6a47" }}>
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {identifiedData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                color: "#7c3fa8",
                                background: "rgba(124,63,168,0.12)"
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3D Pronunciation */}
                    {identifiedData.veddaWordData && (
                      <button
                        onClick={() => navigate(`/3d-visuals/${identifiedData.veddaWordData.id}`, { state: { wordData: identifiedData.veddaWordData } })}
                        className="w-full px-4 py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2"
                        style={{
                          color: "rgba(255,248,230,0.95)",
                          border: "1.5px solid rgba(124,63,168,0.50)",
                          background: "linear-gradient(135deg, rgba(124,63,168,0.75), rgba(74,111,168,0.75))",
                          backdropFilter: "blur(6px)",
                          boxShadow: "0 4px 16px rgba(124,63,168,0.25)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,63,168,0.92), rgba(74,111,168,0.92))";
                          e.currentTarget.style.boxShadow = "0 6px 24px rgba(124,63,168,0.40)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,63,168,0.75), rgba(74,111,168,0.75))";
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,63,168,0.25)";
                        }}
                      >
                        <Volume2 size={18} /> Hear Vedda Pronunciation
                        {identifiedData.veddaWordData.ipa && (
                          <span className="ml-1 text-sm font-normal opacity-80">/{identifiedData.veddaWordData.ipa}/</span>
                        )}
                      </button>
                    )}

                    
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center" style={{ color: "#5c4a1e" }}>
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-lg mb-2" style={{ color: "#3d2e0f" }}>Upload an image to identify</p>
                      <p className="text-sm" style={{ color: "#7c6a47" }}>
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
        <div 
          className="border-t px-6 py-4 flex justify-between items-center"
          style={{
            background: "rgba(255,248,230,0.35)",
            borderColor: "rgba(200,165,90,0.22)"
          }}
        >
          <p className="text-sm" style={{ color: "#3d2e0f" }}>
            💡 <span className="font-medium">Tip:</span> Upload clear, well-lit images for best results
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-lg transition-colors font-medium"
            style={{
              color: "#7c6a47",
              border: "1px solid rgba(200,165,90,0.30)",
              background: "rgba(255,248,230,0.70)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(200,165,90,0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,248,230,0.70)"}
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
