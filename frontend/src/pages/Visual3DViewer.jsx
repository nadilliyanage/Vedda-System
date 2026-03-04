import React, { useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import ModelViewer from '../components/3DViewer/ModelViewer.jsx';
import MorphTargetSlider from '../components/3DViewer/MorphTargetSlider.jsx';
import { useLipSync } from '../hooks/useLipSync';

const Visual3DViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const wordData = location.state?.wordData;

  const [meshesWithMorphTargets, setMeshesWithMorphTargets] = useState([]);
  const [morphTargetNames, setMorphTargetNames] = useState([]);
  const [morphValues, setMorphValues] = useState({});
  const [xrayMode, setXrayMode] = useState(false);
  const talkingAnimationRef = useRef(null);

  const {
    isAnimating,
    animationSpeed,
    setAnimationSpeed,
    updateMorphTarget,
    resetMorphTargets,
    stopAnimation,
    animateIPA,
    speakIPA
  } = useLipSync(meshesWithMorphTargets);

  const handleModelLoad = useCallback((meshes) => {
    setMeshesWithMorphTargets(meshes);
    
    const names = new Set();
    meshes.forEach(mesh => {
      if (mesh.morphTargetDictionary) {
        Object.keys(mesh.morphTargetDictionary).forEach(name => {
          names.add(name);
        });
      }
    });
    
    const nameArray = Array.from(names);
    setMorphTargetNames(nameArray);
    
    const initialValues = {};
    nameArray.forEach(name => {
      initialValues[name] = 0;
    });
    setMorphValues(initialValues);
  }, []);

  const handleMorphChange = useCallback((name, value) => {
    setMorphValues(prev => ({ ...prev, [name]: value }));
    updateMorphTarget(name, value);
  }, [updateMorphTarget]);

  const handleResetMorphs = useCallback(() => {
    stopAnimation();
    if (talkingAnimationRef.current) {
      cancelAnimationFrame(talkingAnimationRef.current);
      talkingAnimationRef.current = null;
    }
    resetMorphTargets();
    const resetValues = {};
    morphTargetNames.forEach(name => {
      resetValues[name] = 0;
    });
    setMorphValues(resetValues);
  }, [morphTargetNames, resetMorphTargets, stopAnimation]);

  const handleStopAnimation = useCallback(() => {
    stopAnimation();
    if (talkingAnimationRef.current) {
      cancelAnimationFrame(talkingAnimationRef.current);
      talkingAnimationRef.current = null;
    }
  }, [stopAnimation]);

  const handlePlayAnimation = useCallback(() => {
    console.log('handlePlayAnimation called', { wordData, meshCount: meshesWithMorphTargets.length });
    if (!wordData || meshesWithMorphTargets.length === 0) {
      console.log('Animation blocked - missing data:', { wordData, meshCount: meshesWithMorphTargets.length });
      return;
    }
    
    if (talkingAnimationRef.current) {
      cancelAnimationFrame(talkingAnimationRef.current);
      talkingAnimationRef.current = null;
    }
    
    console.log('Starting animation with IPA:', wordData.ipa);
    animateIPA(wordData.ipa, (targetMorphs) => {
      const newValues = { ...morphValues };
      Object.keys(targetMorphs).forEach(key => {
        newValues[key] = targetMorphs[key];
      });
      setMorphValues(newValues);
    });
  }, [wordData, meshesWithMorphTargets, animateIPA, morphValues]);

  const handleSpeakAnimation = useCallback(() => {
    console.log('handleSpeakAnimation called', { wordData, meshCount: meshesWithMorphTargets.length });
    if (!wordData || meshesWithMorphTargets.length === 0) {
      console.log('Speak blocked - missing data');
      return;
    }
    
    if (talkingAnimationRef.current) {
      cancelAnimationFrame(talkingAnimationRef.current);
      talkingAnimationRef.current = null;
    }
    
    console.log('Starting speak with:', { word: wordData.word, ipa: wordData.ipa });
    speakIPA(wordData.word, wordData.ipa);
  }, [wordData, meshesWithMorphTargets, speakIPA]);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1c1409" }}>

      {/* 3D Viewer — fills full screen including behind the main header */}
      <div className="absolute inset-0">
        <ModelViewer onModelLoad={handleModelLoad} xrayMode={xrayMode} />
      </div>

      {/* Sub Nav Bar — fixed below main header */}
      <div
        style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'rgba(28,20,8,0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(200,170,100,0.18)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.20)',
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/3d-visuals')}
            className="flex items-center gap-2 text-[rgba(255,248,230,0.90)] bg-white/10 border border-[rgba(200,165,90,0.25)] rounded-[9px] px-3.5 py-1.5 font-semibold text-sm cursor-pointer transition-colors duration-200 hover:bg-[rgba(200,165,90,0.18)]"
          >
            <FaArrowLeft className="text-xs" />
            Back to Words
          </button>
          <span style={{
            color: '#d4b483',
            fontFamily: "'Georgia', serif",
            fontWeight: '700',
            fontSize: '1rem',
            letterSpacing: '-0.2px',
          }}>
            Animation Player
          </span>
        </div>
      </div>

      {/* Control Panel — fixed on the right */}
      <div
        className="fixed right-0 w-96 overflow-y-auto shadow-2xl"
        style={{
          top: '112px', bottom: 0, zIndex: 20,
          background: "rgba(255,252,245,0.97)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderLeft: "1px solid rgba(200,165,90,0.30)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.18)",
        }}
      >
        <div className="p-6 space-y-6">
          {/* Selected Word Display */}
          {wordData ? (
            <div style={{
              padding: "1rem",
              background: "rgba(154,111,42,0.10)",
              border: "1px solid rgba(154,111,42,0.28)",
              borderRadius: "12px",
            }}>
              <div style={{
                fontSize: "0.7rem", color: "#5c4a1e",
                letterSpacing: "0.14em", textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif", marginBottom: "0.5rem",
              }}>
                Selected Word
              </div>
              <div style={{
                fontSize: "1.6rem", fontWeight: "800",
                color: "#1c1409", fontFamily: "'Georgia', serif",
                marginBottom: "0.25rem",
              }}>
                {wordData.word}
              </div>
              <div style={{
                fontSize: "1.05rem", fontFamily: "monospace",
                color: "#7c3fa8",
              }}>
                /{wordData.ipa}/
              </div>
            </div>
          ) : (
            <div style={{
              padding: "1rem",
              background: "rgba(220,150,0,0.08)",
              border: "1px solid rgba(220,150,0,0.28)",
              borderRadius: "12px",
            }}>
              <p style={{ color: "#92600a", fontSize: "0.875rem", fontFamily: "system-ui, sans-serif" }}>
                No word selected. Please go back and select a word.
              </p>
            </div>
          )}

          {/* X-ray Mode Toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.75rem 1rem",
            background: "rgba(255,255,255,0.70)",
            border: "1px solid rgba(200,165,90,0.22)",
            borderRadius: "10px",
          }}>
            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1c1409", fontFamily: "system-ui, sans-serif" }}>
                X-Ray View
              </h4>
              <p style={{ fontSize: "0.75rem", color: "#7c6040", fontFamily: "system-ui, sans-serif" }}>
                See through the model
              </p>
            </div>
            <button
              onClick={() => setXrayMode(!xrayMode)}
              style={{
                position: "relative", display: "inline-flex",
                height: "1.5rem", width: "2.75rem",
                alignItems: "center", borderRadius: "9999px",
                border: "none", cursor: "pointer",
                transition: "background 0.2s",
                background: xrayMode ? "#9a6f2a" : "#c9b99a",
              }}
            >
              <span
                style={{
                  display: "inline-block", height: "1rem", width: "1rem",
                  borderRadius: "9999px", background: "#fff",
                  transition: "transform 0.2s",
                  transform: xrayMode ? "translateX(1.5rem)" : "translateX(0.25rem)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.20)",
                }}
              />
            </button>
          </div>

          {/* Animation Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h4 style={{
              fontSize: "0.72rem", fontWeight: "700", color: "#5c4a1e",
              letterSpacing: "0.14em", textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif",
            }}>
              Animation Controls
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={handlePlayAnimation}
                disabled={!wordData || morphTargetNames.length === 0}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: (!wordData || morphTargetNames.length === 0)
                    ? "#e5e7eb"
                    : "linear-gradient(135deg, #9a6f2a, #c9943a)",
                  color: (!wordData || morphTargetNames.length === 0) ? "#9ca3af" : "#fff",
                  border: "none", borderRadius: "9px",
                  fontWeight: "700", fontSize: "0.9rem",
                  fontFamily: "system-ui, sans-serif",
                  cursor: (!wordData || morphTargetNames.length === 0) ? "not-allowed" : "pointer",
                  boxShadow: (!wordData || morphTargetNames.length === 0) ? "none" : "0 2px 8px rgba(154,111,42,0.30)",
                  transition: "opacity 0.2s",
                }}
              >
                <svg style={{ width: "1.1rem", height: "1.1rem" }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play Animation
              </button>
              <button
                onClick={handleSpeakAnimation}
                disabled={!wordData || morphTargetNames.length === 0}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: (!wordData || morphTargetNames.length === 0)
                    ? "#e5e7eb"
                    : "linear-gradient(135deg, #7c3fa8, #4a6fa8)",
                  color: (!wordData || morphTargetNames.length === 0) ? "#9ca3af" : "#fff",
                  border: "none", borderRadius: "9px",
                  fontWeight: "700", fontSize: "0.9rem",
                  fontFamily: "system-ui, sans-serif",
                  cursor: (!wordData || morphTargetNames.length === 0) ? "not-allowed" : "pointer",
                  boxShadow: (!wordData || morphTargetNames.length === 0) ? "none" : "0 2px 8px rgba(124,63,168,0.30)",
                  transition: "opacity 0.2s",
                }}
              >
                <svg style={{ width: "1.1rem", height: "1.1rem" }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                Speak & Animate
              </button>
              {/* <button 
                onClick={handleStopAnimation}
                disabled={!isAnimating}
              >
                Stop Animation
              </button>
              <button onClick={handleResetMorphs}>
                Reset All
              </button> */}
            </div>
          </div>

          {/* Speed Control */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h4 style={{
              fontSize: "0.72rem", fontWeight: "700", color: "#5c4a1e",
              letterSpacing: "0.14em", textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif",
            }}>
              Speed Control
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.875rem", color: "#3d2e0f", fontFamily: "system-ui, sans-serif" }}>
                  Animation Speed:
                </label>
                <span style={{
                  fontSize: "0.82rem", fontFamily: "monospace",
                  color: "#9a6f2a", background: "rgba(154,111,42,0.10)",
                  border: "1px solid rgba(154,111,42,0.22)",
                  padding: "0.2rem 0.65rem", borderRadius: "6px",
                  fontWeight: "700",
                }}>
                  {animationSpeed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                style={{ width: "100%", cursor: "pointer", accentColor: "#9a6f2a" }}
              />
            </div>
          </div>

          {/* Morph Targets */}
          {/* <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Morph Targets</h4>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {morphTargetNames.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No morph targets found</p>
                  <p className="text-xs text-gray-600 mt-1">Load a 3D model with morph targets</p>
                </div>
              ) : (
                morphTargetNames.map(name => (
                  <MorphTargetSlider
                    key={name}
                    name={name}
                    value={morphValues[name] || 0}
                    onChange={handleMorphChange}
                  />
                ))
              )}
            </div>
          </div> */}
        </div>

        {/* Bottom decorative bar */}
        <div style={{
          width: "52px", height: "3px",
          background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
          margin: "0 auto 1.5rem",
          borderRadius: "99px",
        }} />
      </div>
    </div>
  );
};

export default Visual3DViewer;
