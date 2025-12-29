import React from 'react';
import MorphTargetSlider from './MorphTargetSlider';
import WordSelector from './WordSelector';

const ControlPanel = ({
  morphTargets,
  morphValues,
  onMorphChange,
  text,
  onTextChange,
  onAnimateText,
  onSpeakText,
  onPlayTalking,
  onStopAnimation,
  onResetMorphs,
  animationSpeed,
  onSpeedChange,
  isAnimating,
  onWordSelect,
  onAnimateWord,
  onSpeakWord,
  xrayMode,
  onXrayToggle
}) => {
  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-dark-bg border-l border-dark-border overflow-y-auto shadow-2xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-dark-border pb-4">
          <h3 className="text-xl font-bold text-white">Mouth Animation Controls</h3>
          <p className="text-xs text-gray-400 mt-1">Control lip-sync and morph targets</p>
        </div>

        {/* X-ray Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg border border-dark-border">
          <div>
            <h4 className="text-sm font-semibold text-white">X-Ray View</h4>
            <p className="text-xs text-gray-500">See through the model</p>
          </div>
          <button
            onClick={onXrayToggle}
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

        {/* Word Selector (IPA-based) */}
        <WordSelector 
          onWordSelect={onWordSelect}
          onAnimateWord={onAnimateWord}
          onSpeakWord={onSpeakWord}
          isAnimating={isAnimating}
        />
        
        {/* Morph Targets - Commented out
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Morph Targets</h4>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {morphTargets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No morph targets found</p>
                <p className="text-xs text-gray-600 mt-1">Load a 3D model with morph targets</p>
              </div>
            ) : (
              morphTargets.map(name => (
                <MorphTargetSlider
                  key={name}
                  name={name}
                  value={morphValues[name] || 0}
                  onChange={onMorphChange}
                />
              ))
            )}
          </div>
        </div>
        */}

        {/* Animation Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Animation</h4>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={onPlayTalking}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={morphTargets.length === 0}
            >
              Play Talking Animation
            </button>
            {/* Stop Animation and Reset All buttons - Commented out
            <button 
              onClick={onStopAnimation}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
              disabled={!isAnimating}
            >
              Stop Animation
            </button>
            <button 
              onClick={onResetMorphs}
              className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Reset All
            </button>
            */}
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Text to Speech</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Enter Word/Sentence:</label>
              <input
                type="text"
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Type here..."
                className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={onAnimateText}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!text || morphTargets.length === 0}
              >
                Animate Mouth
              </button>
              <button 
                onClick={onSpeakText}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!text || morphTargets.length === 0}
              >
                Speak & Animate
              </button>
            </div>
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Speed Control</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Animation Speed:</label>
              <span className="text-sm font-mono text-blue-400 bg-dark-surface px-3 py-1 rounded">
                {animationSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-dark-surface rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {isAnimating && (
          <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Animation Running</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
