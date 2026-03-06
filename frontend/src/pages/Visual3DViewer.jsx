import React, { useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import ModelViewer from '../components/3DViewer/ModelViewer.jsx';
import { useLipSync } from '../hooks/useLipSync';

const Visual3DViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const wordData = location.state?.wordData;

  const [meshesWithMorphTargets, setMeshesWithMorphTargets] = useState([]);
  const [morphTargetNames, setMorphTargetNames] = useState([]);
  const [morphValues, setMorphValues] = useState({});
  const [xrayMode, setXrayMode] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
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
        Object.keys(mesh.morphTargetDictionary).forEach(name => names.add(name));
      }
    });
    const nameArray = Array.from(names);
    setMorphTargetNames(nameArray);
    const initialValues = {};
    nameArray.forEach(name => { initialValues[name] = 0; });
    setMorphValues(initialValues);
  }, []);

  const handleResetMorphs = useCallback(() => {
    stopAnimation();
    if (talkingAnimationRef.current) { cancelAnimationFrame(talkingAnimationRef.current); talkingAnimationRef.current = null; }
    resetMorphTargets();
    const resetValues = {};
    morphTargetNames.forEach(name => { resetValues[name] = 0; });
    setMorphValues(resetValues);
  }, [morphTargetNames, resetMorphTargets, stopAnimation]);

  const handleStopAnimation = useCallback(() => {
    stopAnimation();
    if (talkingAnimationRef.current) { cancelAnimationFrame(talkingAnimationRef.current); talkingAnimationRef.current = null; }
  }, [stopAnimation]);

  const handlePlayAnimation = useCallback(() => {
    if (!wordData || meshesWithMorphTargets.length === 0) return;
    if (talkingAnimationRef.current) { cancelAnimationFrame(talkingAnimationRef.current); talkingAnimationRef.current = null; }
    animateIPA(wordData.ipa, (targetMorphs) => {
      const newValues = { ...morphValues };
      Object.keys(targetMorphs).forEach(key => { newValues[key] = targetMorphs[key]; });
      setMorphValues(newValues);
    });
  }, [wordData, meshesWithMorphTargets, animateIPA, morphValues]);

  const handleSpeakAnimation = useCallback(() => {
    if (!wordData || meshesWithMorphTargets.length === 0) return;
    if (talkingAnimationRef.current) { cancelAnimationFrame(talkingAnimationRef.current); talkingAnimationRef.current = null; }
    speakIPA(wordData.word, wordData.ipa);
  }, [wordData, meshesWithMorphTargets, speakIPA]);

  const isDisabled = !wordData || morphTargetNames.length === 0;

  const panelBg = "rgba(250,243,225,0.97)";
  const panelBorder = "1px solid rgba(160,115,40,0.35)";

  const panelContent = (
    <div className="p-5 space-y-5">
      {/* Drag handle - mobile only */}
      <div className="flex justify-center lg:hidden">
        <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'rgba(150,105,35,0.30)' }} />
      </div>

      {/* Selected Word */}
      {wordData ? (
        <div style={{ padding: "1rem", background: "rgba(154,111,42,0.12)", border: "1px solid rgba(154,111,42,0.30)", borderRadius: "12px" }}>
          <div style={{ fontSize: "0.7rem", color: "rgba(120,85,15,0.70)", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", marginBottom: "0.5rem" }}>
            Selected Word
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1c1409", fontFamily: "'Georgia', serif", marginBottom: "0.25rem" }}>
            {wordData.word}
          </div>
          <div style={{ fontSize: "1.05rem", fontFamily: "monospace", color: "rgba(100,70,20,0.85)" }}>
            /{wordData.ipa}/
          </div>
        </div>
      ) : (
        <div style={{ padding: "1rem", background: "rgba(154,111,42,0.08)", border: "1px solid rgba(154,111,42,0.22)", borderRadius: "12px" }}>
          <p style={{ color: "rgba(100,70,20,0.70)", fontSize: "0.875rem", fontFamily: "system-ui, sans-serif" }}>
            No word selected. Please go back and select a word.
          </p>
        </div>
      )}

      {/* X-Ray Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(150,105,35,0.22)", borderRadius: "10px" }}>
        <div>
          <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1c1409", fontFamily: "system-ui, sans-serif" }}>X-Ray View</h4>
          <p style={{ fontSize: "0.75rem", color: "rgba(80,55,15,0.60)", fontFamily: "system-ui, sans-serif" }}>See through the model</p>
        </div>
        <button
          onClick={() => setXrayMode(!xrayMode)}
          style={{
            position: "relative", display: "inline-flex", height: "1.5rem", width: "2.75rem",
            alignItems: "center", borderRadius: "9999px", border: "none", cursor: "pointer",
            transition: "background 0.2s",
            background: xrayMode ? "rgba(154,111,42,0.90)" : "rgba(180,155,100,0.35)",
          }}
        >
          <span style={{
            display: "inline-block", height: "1rem", width: "1rem", borderRadius: "9999px",
            background: "#fff", transition: "transform 0.2s",
            transform: xrayMode ? "translateX(1.5rem)" : "translateX(0.25rem)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }} />
        </button>
      </div>

      {/* Animation Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h4 style={{ fontSize: "0.72rem", fontWeight: "700", color: "rgba(120,85,15,0.75)", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>
          Animation Controls
        </h4>
        <button
          onClick={handlePlayAnimation}
          disabled={isDisabled}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "0.75rem 1rem",
            background: isDisabled ? "rgba(180,160,120,0.22)" : "linear-gradient(135deg, rgba(154,111,42,0.92), rgba(185,138,55,0.95))",
            color: isDisabled ? "rgba(120,90,30,0.38)" : "rgba(255,248,230,0.96)",
            border: isDisabled ? "1px solid rgba(180,150,80,0.20)" : "1px solid rgba(212,175,90,0.35)",
            borderRadius: "9px", fontWeight: "700", fontSize: "0.9rem", fontFamily: "system-ui, sans-serif",
            cursor: isDisabled ? "not-allowed" : "pointer",
            boxShadow: isDisabled ? "none" : "0 2px 8px rgba(154,111,42,0.30)",
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
          disabled={isDisabled}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "0.75rem 1rem",
            background: isDisabled ? "rgba(180,160,120,0.22)" : "linear-gradient(135deg, rgba(90,65,130,0.88), rgba(65,100,150,0.88))",
            color: isDisabled ? "rgba(120,90,30,0.38)" : "rgba(255,248,230,0.96)",
            border: isDisabled ? "1px solid rgba(180,150,80,0.20)" : "1px solid rgba(150,130,200,0.28)",
            borderRadius: "9px", fontWeight: "700", fontSize: "0.9rem", fontFamily: "system-ui, sans-serif",
            cursor: isDisabled ? "not-allowed" : "pointer",
            boxShadow: isDisabled ? "none" : "0 2px 8px rgba(90,65,130,0.28)",
            transition: "opacity 0.2s",
          }}
        >
          <svg style={{ width: "1.1rem", height: "1.1rem" }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
          Speak &amp; Animate
        </button>
      </div>

      {/* Speed Control */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h4 style={{ fontSize: "0.72rem", fontWeight: "700", color: "rgba(120,85,15,0.75)", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>
          Speed Control
        </h4>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "0.875rem", color: "rgba(90,60,15,0.80)", fontFamily: "system-ui, sans-serif" }}>Animation Speed:</label>
          <span style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "#7a5015", background: "rgba(154,111,42,0.15)", border: "1px solid rgba(154,111,42,0.30)", padding: "0.2rem 0.65rem", borderRadius: "6px", fontWeight: "700" }}>
            {animationSpeed.toFixed(1)}x
          </span>
        </div>
        <input
          type="range" min="0.1" max="3" step="0.1" value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
          style={{ width: "100%", cursor: "pointer", accentColor: "#9a6f2a" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.72rem", color: "rgba(100,70,20,0.50)", fontFamily: "system-ui, sans-serif" }}>Slower</span>
          <span style={{ fontSize: "0.72rem", color: "rgba(100,70,20,0.50)", fontFamily: "system-ui, sans-serif" }}>Faster</span>
        </div>
      </div>

      {/* Status */}
      {isAnimating && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1rem", background: "rgba(22,101,52,0.12)", border: "1px solid rgba(74,222,128,0.35)", borderRadius: "10px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} className="animate-pulse" />
          <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: "600", fontFamily: "system-ui, sans-serif" }}>Animation Running</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1c1409" }}>

      {/* 3D Viewer */}
      <div className="absolute inset-0">
        <ModelViewer onModelLoad={handleModelLoad} xrayMode={xrayMode} />
      </div>

      {/* Sub Nav Bar */}
      <div style={{
        position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 25,
        background: 'rgba(28,20,8,0.85)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(200,170,100,0.18)', boxShadow: '0 2px 16px rgba(0,0,0,0.20)',
      }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/3d-visuals')}
            className="flex items-center gap-2 text-[rgba(255,248,230,0.90)] bg-white/10 border border-[rgba(200,165,90,0.25)] rounded-[9px] px-3.5 py-1.5 font-semibold text-sm cursor-pointer transition-colors duration-200 hover:bg-[rgba(200,165,90,0.18)]"
          >
            <FaArrowLeft className="text-xs" />
            <span className="hidden sm:inline">Back to Words</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div style={{ color: '#d4b483', fontFamily: "system-ui, sans-serif", fontWeight: '600', fontSize: '0.9rem' }}>
            Animation Player
          </div>

          {/* Mobile controls toggle */}
          <button
            className="lg:hidden flex items-center gap-1.5 text-[rgba(255,248,230,0.90)] bg-white/10 border border-[rgba(200,165,90,0.25)] rounded-[9px] px-3 py-1.5 font-semibold text-xs transition-colors hover:bg-[rgba(200,165,90,0.18)]"
            onClick={() => setIsPanelOpen(v => !v)}
          >
            {isPanelOpen ? 'Close' : 'Controls'}
          </button>
        </div>
      </div>

      {/* Desktop Control Panel (right side) */}
      <div
        className="hidden lg:block fixed right-0 overflow-y-auto"
        style={{
          top: '112px', bottom: 0, zIndex: 15, width: '384px',
          background: panelBg, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          borderLeft: panelBorder, boxShadow: "-4px 0 24px rgba(0,0,0,0.22)",
        }}
      >
        {panelContent}
        <div style={{ width: "52px", height: "3px", background: "linear-gradient(90deg, #9a6f2a, #c9943a)", margin: "0 auto 1.5rem", borderRadius: "99px" }} />
      </div>

      {/* Mobile backdrop (transparent click-catcher) */}
      {isPanelOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* Mobile Control Panel (bottom sheet) */}
      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 overflow-y-auto z-30 transition-transform duration-300 ease-in-out"
        style={{
          maxHeight: '42vh',
          background: panelBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: panelBorder, borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.28)",
          transform: isPanelOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {panelContent}
      </div>
    </div>
  );
};

export default Visual3DViewer;
