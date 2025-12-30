import React from 'react';

const MorphTargetSlider = ({ name, value, onChange }) => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-dark-surface rounded-lg border border-dark-border">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{name}</label>
        <span className="text-xs font-mono text-blue-400 bg-dark-bg px-2 py-1 rounded">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(name, parseFloat(e.target.value))}
        className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
};

export default MorphTargetSlider;
