import React, { useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    <div className="relative w-screen h-screen overflow-hidden bg-dark-bg pt-10">
      <ModelViewer onModelLoad={handleModelLoad} xrayMode={xrayMode} />
      
      {/* Control Panel */}
      <div className="fixed top-15 right-0 h-full w-96 bg-dark-bg border-l border-dark-border overflow-y-auto shadow-2xl bg-blue-200">
        <div className="p-6 space-y-6">
          {/* Header with Back Button */}
          <div className="border-b border-dark-border pb-4">
            <button
              onClick={() => navigate('/3d-visuals')}
              className="flex items-center gap-2 text-gray-700 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Words
            </button>
            <h3 className="text-xl font-bold text-blue-500">Animation Player</h3>
            <p className="text-xs text-gray-700 mt-1">Control lip-sync animation</p>
          </div>

          {/* Selected Word Display */}
          {wordData ? (
            <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
              <div className="text-xs text-blue-900 mb-2 uppercase tracking-wide">Selected Word</div>
              <div className="text-2xl font-bold text-white mb-1">{wordData.word}</div>
              <div className="text-lg font-mono text-blue-600">/{wordData.ipa}/</div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-xl">
              <p className="text-yellow-400 text-sm">No word selected. Please go back and select a word.</p>
            </div>
          )}

          {/* X-ray Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg border border-dark-border">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">X-Ray View</h4>
              <p className="text-xs text-gray-500">See through the model</p>
            </div>
            <button
              onClick={() => setXrayMode(!xrayMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-bg ${
                xrayMode ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  xrayMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Animation Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Animation Controls</h4>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={handlePlayAnimation}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={!wordData || morphTargetNames.length === 0}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play Animation
              </button>
              <button 
                onClick={handleSpeakAnimation}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={!wordData || morphTargetNames.length === 0}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                Speak & Animate
              </button>
              {/* <button 
                onClick={handleStopAnimation}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                disabled={!isAnimating}
              >
                Stop Animation
              </button>
              <button 
                onClick={handleResetMorphs}
                className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Reset All
              </button> */}
            </div>
          </div>

          {/* Speed Control */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Speed Control</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-800">Animation Speed:</label>
                <span className="text-sm font-mono text-blue-800 bg-dark-surface px-3 py-1 rounded">
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
                className="w-full h-2 bg-dark-surface rounded-lg appearance-auto cursor-pointer accent-blue-800"
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
      </div>
    </div>
  );
};

export default Visual3DViewer;
