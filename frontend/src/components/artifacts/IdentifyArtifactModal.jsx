import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Upload, Sparkles, Loader2, TrendingUp, Volume2, Crop, Check, Trash2 } from 'lucide-react';
import { Info } from 'lucide-react';
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
  const imageRef = useRef(null);

  // Instructions popup
  const [showInstructions, setShowInstructions] = useState(false);
  const instructionsButtonRef = useRef(null);
  const instructionsPopupRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!showInstructions) return;
      const popup = instructionsPopupRef.current;
      const btn = instructionsButtonRef.current;
      if (popup && !popup.contains(e.target) && btn && !btn.contains(e.target)) {
        setShowInstructions(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showInstructions]);

  // Crop state (display coordinates relative to rendered image)
  const [cropMode, setCropMode] = useState(false); // whether crop mode is enabled
  const [cropRect, setCropRect] = useState(null); // { x, y, width, height }
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragHandle, setDragHandle] = useState(null); // which handle is being dragged

  const MIN_CROP_SIZE = 50; // minimum crop size in pixels

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
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

  // Check if mouse is over a handle
  const getHandleAtPoint = (x, y, crop) => {
    if (!crop) return null;
    const handleSize = 12;
    const { x: cx, y: cy, width: cw, height: ch } = crop;
    
    const handles = {
      'nw': { x: cx, y: cy },
      'n': { x: cx + cw / 2, y: cy },
      'ne': { x: cx + cw, y: cy },
      'e': { x: cx + cw, y: cy + ch / 2 },
      'se': { x: cx + cw, y: cy + ch },
      's': { x: cx + cw / 2, y: cy + ch },
      'sw': { x: cx, y: cy + ch },
      'w': { x: cx, y: cy + ch / 2 }
    };

    for (const [name, pos] of Object.entries(handles)) {
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist <= handleSize) return name;
    }
    return null;
  };

  // Mouse handlers for drawing/dragging crop rectangle on displayed image
  const onOverlayMouseDown = (e) => {
      if (!imageRef.current || !cropMode) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on a handle
    const handle = getHandleAtPoint(x, y, cropRect);
    if (handle && cropRect) {
      setDragHandle(handle);
      setDragStart({ x, y });
      setIsDraggingCrop(true);
      return;
    }

    // Otherwise, start new crop
    setCropRect({ x, y, width: 100, height: 100 });
    setIsDraggingCrop(true);
    setDragStart({ x, y });
    setDragHandle(null);
  };

  const onOverlayMouseMove = (e) => {
    if (!isDraggingCrop || !imageRef.current || !dragStart) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    if (dragHandle && cropRect) {
      // Dragging a handle - resize the crop area
      let newCrop = { ...cropRect };
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      if (dragHandle.includes('n')) {
        newCrop.y = Math.max(0, newCrop.y + dy);
        newCrop.height = Math.max(MIN_CROP_SIZE, newCrop.height - dy);
      }
      if (dragHandle.includes('s')) {
        newCrop.height = Math.max(MIN_CROP_SIZE, newCrop.height + dy);
      }
      if (dragHandle.includes('w')) {
        newCrop.x = Math.max(0, newCrop.x + dx);
        newCrop.width = Math.max(MIN_CROP_SIZE, newCrop.width - dx);
      }
      if (dragHandle.includes('e')) {
        newCrop.width = Math.max(MIN_CROP_SIZE, newCrop.width + dx);
      }

      // Ensure crop stays within image bounds
      newCrop.x = Math.max(0, Math.min(newCrop.x, rect.width - newCrop.width));
      newCrop.y = Math.max(0, Math.min(newCrop.y, rect.height - newCrop.height));

      setCropRect(newCrop);
      setDragStart({ x, y });
    } else {
      // Drawing new crop area
      const sx = Math.min(dragStart.x, x);
      const sy = Math.min(dragStart.y, y);
      const w = Math.abs(x - dragStart.x);
      const h = Math.abs(y - dragStart.y);
      setCropRect({ x: sx, y: sy, width: w, height: h });
    }
  };

  const onOverlayMouseUp = () => {
    setIsDraggingCrop(false);
    setDragStart(null);
    setDragHandle(null);
  };

  // Touch event handlers for mobile support
  const onOverlayTouchStart = (e) => {
    if (!imageRef.current || !cropMode) return;
    const touch = e.touches[0];
    const rect = imageRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Check if touching a handle
    const handle = getHandleAtPoint(x, y, cropRect);
    if (handle && cropRect) {
      setDragHandle(handle);
      setDragStart({ x, y });
      setIsDraggingCrop(true);
      return;
    }

    // Otherwise, start new crop
    setCropRect({ x, y, width: 100, height: 100 });
    setIsDraggingCrop(true);
    setDragStart({ x, y });
    setDragHandle(null);
  };

  const onOverlayTouchMove = (e) => {
    if (!isDraggingCrop || !imageRef.current || !dragStart) return;
    const touch = e.touches[0];
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));

    if (dragHandle && cropRect) {
      // Dragging a handle - resize the crop area
      let newCrop = { ...cropRect };
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      if (dragHandle.includes('n')) {
        newCrop.y = Math.max(0, newCrop.y + dy);
        newCrop.height = Math.max(MIN_CROP_SIZE, newCrop.height - dy);
      }
      if (dragHandle.includes('s')) {
        newCrop.height = Math.max(MIN_CROP_SIZE, newCrop.height + dy);
      }
      if (dragHandle.includes('w')) {
        newCrop.x = Math.max(0, newCrop.x + dx);
        newCrop.width = Math.max(MIN_CROP_SIZE, newCrop.width - dx);
      }
      if (dragHandle.includes('e')) {
        newCrop.width = Math.max(MIN_CROP_SIZE, newCrop.width + dx);
      }

      newCrop.x = Math.max(0, Math.min(newCrop.x, rect.width - newCrop.width));
      newCrop.y = Math.max(0, Math.min(newCrop.y, rect.height - newCrop.height));

      setCropRect(newCrop);
      setDragStart({ x, y });
    } else {
      // Drawing new crop area
      const sx = Math.min(dragStart.x, x);
      const sy = Math.min(dragStart.y, y);
      const w = Math.abs(x - dragStart.x);
      const h = Math.abs(y - dragStart.y);
      setCropRect({ x: sx, y: sy, width: w, height: h });
    }
  };

  const onOverlayTouchEnd = () => {
    setIsDraggingCrop(false);
    setDragStart(null);
    setDragHandle(null);
  };

    // Create cropped image (returns File)
    const getCroppedImageFile = async () => {
      if (!cropRect || !imagePreview || !imageRef.current) return null;
      const img = new Image();
      img.src = imagePreview;
      await new Promise((res) => { img.onload = res; img.onerror = res; });

      const imgRect = imageRef.current.getBoundingClientRect();
      const displayWidth = imgRect.width;
      const displayHeight = imgRect.height;
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      const scaleX = naturalW / displayWidth;
      const scaleY = naturalH / displayHeight;

      const sx = Math.round(cropRect.x * scaleX);
      const sy = Math.round(cropRect.y * scaleY);
      const sw = Math.round(cropRect.width * scaleX);
      const sh = Math.round(cropRect.height * scaleY);

      if (sw <= 0 || sh <= 0) return null;

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = imageFile && imageFile.name ? `cropped-${imageFile.name}` : 'cropped.png';
      const file = new File([blob], fileName, { type: blob.type });
      return { file, dataUrl };
    };

    const handleApplyCrop = async () => {
      try {
        const cropped = await getCroppedImageFile();
        if (!cropped) {
          toast.error('Please select a crop area first');
          return;
        }
        setImageFile(cropped.file);
        setImagePreview(cropped.dataUrl);
        setCropRect(null);
        toast.success('Cropped image applied');
      } catch (err) {
        console.error('Crop error', err);
        toast.error('Failed to crop image');
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
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <h2 className="text-2xl font-bold text-white">Identify Artifact</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              ref={instructionsButtonRef}
              onClick={() => setShowInstructions((s) => !s)}
              aria-label="Show crop instructions"
              className="text-white hover:bg-black/10 rounded-full p-2 transition-colors"
            >
              <Info size={18} />
            </button>

            {showInstructions && (
              <div
                ref={instructionsPopupRef}
                role="dialog"
                aria-modal="false"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '56px',
                  width: 360,
                  zIndex: 60
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.98)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 12, border: '1px solid rgba(200,165,90,0.12)' }}>
                  <div style={{ fontWeight: 700, color: '#5c4a1e', marginBottom: 6 }}>Crop instructions</div>
                  <div style={{ color: '#3d2e0f', fontSize: 13, lineHeight: 1.5 }}>
                    <div style={{ marginBottom: 6 }}><strong>1. Click the Crop button</strong> to enable crop mode</div>
                    <div style={{ marginBottom: 6 }}><strong>2. Click and drag</strong> on the image to create a crop area</div>
                    <div style={{ marginBottom: 6 }}><strong>3. Drag handles</strong> (white circles) to resize the crop area</div>
                    <div style={{ marginBottom: 6 }}><strong>4. Use the grid</strong> to align your crop</div>
                    <div style={{ marginBottom: 6 }}><strong>5. Click the checkmark icon</strong> to apply or trash icon to discard</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className="text-white hover:bg-black/10 rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
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
                {/* Instructions popup has been moved to header info icon */}
                
                {imagePreview ? (
                  <div className="flex-1 flex flex-col gap-4">
                    <div 
                      className="flex items-center justify-center rounded-lg overflow-hidden w-full h-64 relative"
                      style={{ background: "rgba(255,248,230,0.65)" }}
                      onMouseDown={onOverlayMouseDown}
                      onMouseMove={onOverlayMouseMove}
                      onMouseUp={onOverlayMouseUp}
                      onMouseLeave={onOverlayMouseUp}
                      onTouchStart={onOverlayTouchStart}
                      onTouchMove={onOverlayTouchMove}
                      onTouchEnd={onOverlayTouchEnd}
                    >
                      <img
                        ref={imageRef}
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />

                      {/* Crop UI */}
                      <div style={{ position: 'absolute', inset: 0 }}>
                        {cropMode && cropRect && (
                          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                          {/* Dark overlay outside crop area */}
                          <svg
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              pointerEvents: 'none'
                            }}
                          >
                            <defs>
                              <mask id="cropMask">
                                <rect width="100%" height="100%" fill="white" />
                                <rect
                                  x={cropRect.x}
                                  y={cropRect.y}
                                  width={cropRect.width}
                                  height={cropRect.height}
                                  fill="black"
                                />
                              </mask>
                            </defs>
                            <rect
                              width="100%"
                              height="100%"
                              fill="rgba(0,0,0,0.55)"
                              mask="url(#cropMask)"
                            />
                          </svg>

                          {/* Crop border and grid */}
                          <div
                            style={{
                              position: 'absolute',
                              left: cropRect.x + 'px',
                              top: cropRect.y + 'px',
                              width: cropRect.width + 'px',
                              height: cropRect.height + 'px',
                              border: '2px solid rgba(124,63,168,1)',
                              boxShadow: '0 0 0 1px rgba(255,255,255,0.5) inset',
                              pointerEvents: 'none'
                            }}
                          >
                            {/* 3x3 Grid */}
                            {[...Array(2)].map((_, i) => (
                              <div
                                key={`v${i}`}
                                style={{
                                  position: 'absolute',
                                  left: ((i + 1) * cropRect.width) / 3 + 'px',
                                  top: 0,
                                  width: '1px',
                                  height: '100%',
                                  background: 'rgba(124,63,168,0.4)',
                                  pointerEvents: 'none'
                                }}
                              />
                            ))}
                            {[...Array(2)].map((_, i) => (
                              <div
                                key={`h${i}`}
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: ((i + 1) * cropRect.height) / 3 + 'px',
                                  width: '100%',
                                  height: '1px',
                                  background: 'rgba(124,63,168,0.4)',
                                  pointerEvents: 'none'
                                }}
                              />
                            ))}
                          </div>

                            {/* Handles */}
                            {[
                              { name: 'nw', x: 0, y: 0, cursor: 'nw-resize' },
                              { name: 'n', x: 0.5, y: 0, cursor: 'n-resize' },
                              { name: 'ne', x: 1, y: 0, cursor: 'ne-resize' },
                              { name: 'e', x: 1, y: 0.5, cursor: 'e-resize' },
                              { name: 'se', x: 1, y: 1, cursor: 'se-resize' },
                              { name: 's', x: 0.5, y: 1, cursor: 's-resize' },
                              { name: 'sw', x: 0, y: 1, cursor: 'sw-resize' },
                              { name: 'w', x: 0, y: 0.5, cursor: 'w-resize' }
                            ].map((handle) => (
                              <div
                                key={handle.name}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const rect = imageRef.current.getBoundingClientRect();
                                  setDragHandle(handle.name);
                                  setDragStart({
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top
                                  });
                                  setIsDraggingCrop(true);
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const touch = e.touches[0];
                                  const rect = imageRef.current.getBoundingClientRect();
                                  setDragHandle(handle.name);
                                  setDragStart({
                                    x: touch.clientX - rect.left,
                                    y: touch.clientY - rect.top
                                  });
                                  setIsDraggingCrop(true);
                                }}
                                style={{
                                  position: 'absolute',
                                  left: (cropRect.x + cropRect.width * handle.x - 10) + 'px',
                                  top: (cropRect.y + cropRect.height * handle.y - 10) + 'px',
                                  width: '20px',
                                  height: '20px',
                                  background: 'white',
                                  border: '2.5px solid rgba(124,63,168,1)',
                                  borderRadius: '50%',
                                  cursor: handle.cursor,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                  pointerEvents: 'auto',
                                  transition: dragHandle === handle.name ? 'none' : 'transform 0.1s',
                                  touchAction: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  if (dragHandle !== handle.name) {
                                    e.currentTarget.style.transform = 'scale(1.25)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (dragHandle !== handle.name) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }
                                }}
                              />
                            ))}
                          </div>
                        )}

                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={() => {
                              setCropMode((current) => {
                                const next = !current;
                                if (!next) setCropRect(null);
                                return next;
                              });
                            }}
                            aria-label={cropMode ? 'Disable crop mode' : 'Enable crop mode'}
                            className="absolute bottom-3 right-3 rounded-full transition-colors flex items-center justify-center"
                            style={{
                              pointerEvents: 'auto',
                              width: '40px',
                              height: '40px',
                              background: cropMode ? 'rgba(124,63,168,0.95)' : 'rgba(255,255,255,0.92)',
                              color: cropMode ? '#fff' : '#7c3fa8',
                              border: '1px solid rgba(124,63,168,0.35)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <Crop size={18} />
                          </button>

                          {cropRect && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={() => setCropRect(null)}
                              aria-label="Discard crop"
                              className="absolute top-3 left-3 rounded-full transition-colors flex items-center justify-center"
                              style={{
                                pointerEvents: 'auto',
                                width: '34px',
                                height: '34px',
                                background: 'rgba(220,100,100,0.92)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.35)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                                fontSize: '11px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {cropRect && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={handleApplyCrop}
                              aria-label="Apply crop"
                              className="absolute top-3 right-3 rounded-full transition-colors flex items-center justify-center"
                              style={{
                                pointerEvents: 'auto',
                                width: '34px',
                                height: '34px',
                                background: 'rgba(61,153,87,0.92)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.35)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setIdentifiedData(null);
                          setCropRect(null);
                          setCropMode(false);
                        }}
                        className="px-3 py-2 rounded-lg transition-colors font-medium"
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
                        className="px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
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
                    <p className="text-sm" style={{ color: "#7c6a47" }}>PNG, JPG, WEBP up to 10MB</p>
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
