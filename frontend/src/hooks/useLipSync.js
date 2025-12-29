import { useState, useCallback, useRef } from 'react';
import { phonemeToViseme, ipaToViseme, findBestMorphMatch, textToPhonemes, ipaToPhonemes } from '../utils/lipSyncUtils';

export const useLipSync = (meshesWithMorphTargets) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const animationIdRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const updateMorphTarget = useCallback((name, value) => {
    meshesWithMorphTargets.forEach(mesh => {
      if (mesh.morphTargetDictionary && name in mesh.morphTargetDictionary) {
        const index = mesh.morphTargetDictionary[name];
        mesh.morphTargetInfluences[index] = value;
      }
    });
  }, [meshesWithMorphTargets]);

  const smoothTransition = useCallback((targetMorphs, duration = 100) => {
    const startValues = {};
    
    // Store current values
    meshesWithMorphTargets.forEach(mesh => {
      if (mesh.morphTargetDictionary) {
        Object.keys(mesh.morphTargetDictionary).forEach(name => {
          const index = mesh.morphTargetDictionary[name];
          startValues[name] = mesh.morphTargetInfluences[index];
        });
      }
    });
    
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Interpolate all morph targets
      meshesWithMorphTargets.forEach(mesh => {
        if (mesh.morphTargetDictionary) {
          Object.keys(mesh.morphTargetDictionary).forEach(name => {
            const index = mesh.morphTargetDictionary[name];
            const start = startValues[name] || 0;
            const target = targetMorphs[name] || 0;
            mesh.morphTargetInfluences[index] = start + (target - start) * eased;
          });
        }
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [meshesWithMorphTargets]);

  const resetMorphTargets = useCallback(() => {
    meshesWithMorphTargets.forEach(mesh => {
      if (mesh.morphTargetInfluences) {
        for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
          mesh.morphTargetInfluences[i] = 0;
        }
      }
    });
  }, [meshesWithMorphTargets]);

  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    setIsAnimating(false);
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, []);

  const animateText = useCallback((text, onPhonemeChange) => {
    if (!text || meshesWithMorphTargets.length === 0) return;
    
    stopAnimation();
    isAnimatingRef.current = true;
    setIsAnimating(true);
    
    const availableMorphs = [];
    if (meshesWithMorphTargets[0] && meshesWithMorphTargets[0].morphTargetDictionary) {
      availableMorphs.push(...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary));
    }
    
    const phonemes = textToPhonemes(text);
    let phonemeIndex = 0;
    
    const animateNextPhoneme = () => {
      if (!isAnimatingRef.current || phonemeIndex >= phonemes.length) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        const targetMorphs = {};
        smoothTransition(targetMorphs, 200);
        return;
      }
      
      const phoneme = phonemes[phonemeIndex];
      
      if (phoneme === '_pause') {
        const targetMorphs = {};
        const openMorph = findBestMorphMatch(['mouthOpen', 'A'], availableMorphs);
        if (openMorph) targetMorphs[openMorph] = 0.15;
        smoothTransition(targetMorphs, 80 / animationSpeed);
        phonemeIndex++;
        setTimeout(animateNextPhoneme, 100 / animationSpeed);
        return;
      }
      
      const viseme = phonemeToViseme[phoneme];
      
      if (viseme) {
        const targetMorphs = {};
        
        const primaryMorph = findBestMorphMatch(viseme.primary, availableMorphs);
        if (primaryMorph) {
          targetMorphs[primaryMorph] = viseme.weight;
        }
        
        if (viseme.secondary && viseme.secondary.length > 0) {
          const secondaryMorph = findBestMorphMatch(viseme.secondary, availableMorphs);
          if (secondaryMorph) {
            targetMorphs[secondaryMorph] = viseme.secondaryWeight || 0.3;
          }
        }
        
        smoothTransition(targetMorphs, 60);
        
        if (onPhonemeChange) {
          onPhonemeChange(targetMorphs);
        }
        
        const duration = (viseme.duration || 120) / animationSpeed;
        phonemeIndex++;
        setTimeout(animateNextPhoneme, duration);
      } else {
        const targetMorphs = {};
        const genericMorph = findBestMorphMatch(['mouthOpen', 'A'], availableMorphs);
        if (genericMorph) targetMorphs[genericMorph] = 0.3;
        smoothTransition(targetMorphs, 60 / animationSpeed);
        
        phonemeIndex++;
        setTimeout(animateNextPhoneme, 100 / animationSpeed);
      }
    };
    
    animateNextPhoneme();
  }, [meshesWithMorphTargets, animationSpeed, stopAnimation, smoothTransition]);

  const speakText = useCallback((text) => {
    if (!text || meshesWithMorphTargets.length === 0) return;
    
    stopAnimation();
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8 * animationSpeed;
      utterance.pitch = 1;
      
      const availableMorphs = [];
      if (meshesWithMorphTargets[0] && meshesWithMorphTargets[0].morphTargetDictionary) {
        availableMorphs.push(...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary));
      }
      
      const phonemes = textToPhonemes(text);
      const phonemeDuration = 120 / animationSpeed;
      
      isAnimatingRef.current = true;
      setIsAnimating(true);
      let phonemeIndex = 0;
      let startTime = null;
      
      const animateSpeaking = () => {
        if (!isAnimatingRef.current) {
          resetMorphTargets();
          return;
        }
        
        if (!startTime) startTime = Date.now();
        const elapsed = Date.now() - startTime;
        
        const currentPhonemeIndex = Math.floor(elapsed / phonemeDuration);
        
        if (currentPhonemeIndex !== phonemeIndex && currentPhonemeIndex < phonemes.length) {
          phonemeIndex = currentPhonemeIndex;
          const phoneme = phonemes[phonemeIndex];
          const viseme = phonemeToViseme[phoneme];
          
          const targetMorphs = {};
          
          if (viseme && phoneme !== '_pause') {
            const primaryMorph = findBestMorphMatch(viseme.primary, availableMorphs);
            if (primaryMorph) {
              targetMorphs[primaryMorph] = viseme.weight;
            }
            
            if (viseme.secondary && viseme.secondary.length > 0) {
              const secondaryMorph = findBestMorphMatch(viseme.secondary, availableMorphs);
              if (secondaryMorph) {
                targetMorphs[secondaryMorph] = viseme.secondaryWeight || 0.3;
              }
            }
          } else {
            const openMorph = findBestMorphMatch(['mouthOpen', 'A'], availableMorphs);
            if (openMorph) targetMorphs[openMorph] = 0.1;
          }
          
          smoothTransition(targetMorphs, 50);
        }
        
        if (window.speechSynthesis.speaking) {
          animationIdRef.current = requestAnimationFrame(animateSpeaking);
        } else {
          isAnimatingRef.current = false;
          setIsAnimating(false);
          resetMorphTargets();
        }
      };
      
      utterance.onstart = () => {
        startTime = Date.now();
        animateSpeaking();
      };
      
      utterance.onend = () => {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        stopAnimation();
        setTimeout(() => resetMorphTargets(), 200);
      };
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis not supported in this browser. Use "Animate Mouth" instead.');
    }
  }, [meshesWithMorphTargets, animationSpeed, stopAnimation, smoothTransition, resetMorphTargets]);

  const animateIPA = useCallback((ipaTranscription, onPhonemeChange) => {
    console.log('animateIPA called with:', ipaTranscription);
    if (!ipaTranscription || meshesWithMorphTargets.length === 0) {
      console.log('animateIPA blocked:', { ipaTranscription, meshCount: meshesWithMorphTargets.length });
      return;
    }
    
    stopAnimation();
    isAnimatingRef.current = true;
    setIsAnimating(true);
    
    const availableMorphs = [];
    if (meshesWithMorphTargets[0] && meshesWithMorphTargets[0].morphTargetDictionary) {
      availableMorphs.push(...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary));
    }
    
    console.log('Available morph targets:', availableMorphs);
    
    const phonemes = ipaToPhonemes(ipaTranscription);
    console.log('Phonemes from IPA:', phonemes);
    let phonemeIndex = 0;
    
    const animateNextPhoneme = () => {
      if (!isAnimatingRef.current || phonemeIndex >= phonemes.length) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        const targetMorphs = {};
        smoothTransition(targetMorphs, 200);
        return;
      }
      
      const phoneme = phonemes[phonemeIndex];
      
      if (phoneme === '_pause') {
        const targetMorphs = {};
        const openMorph = findBestMorphMatch(['mouthOpen', 'A'], availableMorphs);
        if (openMorph) targetMorphs[openMorph] = 0.15;
        smoothTransition(targetMorphs, 80 / animationSpeed);
        phonemeIndex++;
        setTimeout(animateNextPhoneme, 100 / animationSpeed);
        return;
      }
      
      const viseme = ipaToViseme[phoneme];
      
      if (viseme) {
        const targetMorphs = {};
        
        const primaryMorph = findBestMorphMatch(viseme.primary, availableMorphs);
        if (primaryMorph) {
          targetMorphs[primaryMorph] = viseme.weight;
        }
        
        if (viseme.secondary && viseme.secondary.length > 0) {
          const secondaryMorph = findBestMorphMatch(viseme.secondary, availableMorphs);
          if (secondaryMorph) {
            targetMorphs[secondaryMorph] = viseme.secondaryWeight || 0.3;
          }
        }
        
        smoothTransition(targetMorphs, 60);
        
        if (onPhonemeChange) {
          onPhonemeChange(targetMorphs);
        }
        
        const duration = (viseme.duration || 120) / animationSpeed;
        phonemeIndex++;
        setTimeout(animateNextPhoneme, duration);
      } else {
        const targetMorphs = {};
        const genericMorph = findBestMorphMatch(['mouthOpen', 'A'], availableMorphs);
        if (genericMorph) targetMorphs[genericMorph] = 0.3;
        smoothTransition(targetMorphs, 60 / animationSpeed);
        
        phonemeIndex++;
        setTimeout(animateNextPhoneme, 100 / animationSpeed);
      }
    };
    
    animateNextPhoneme();
  }, [meshesWithMorphTargets, animationSpeed, stopAnimation, smoothTransition]);

  const speakIPA = useCallback((word, ipaTranscription) => {
    console.log('speakIPA called with:', { word, ipaTranscription });
    if (!word || !ipaTranscription || meshesWithMorphTargets.length === 0) {
      console.log('speakIPA blocked:', { word, ipaTranscription, meshCount: meshesWithMorphTargets.length });
      return;
    }
    
    stopAnimation();
    
    if ('speechSynthesis' in window) {
      // Use the IPA transcription for speaking as it's in Latin characters
      const utterance = new SpeechSynthesisUtterance(ipaTranscription);
      utterance.rate = 0.8 * animationSpeed;
      utterance.pitch = 1;
      
      const availableMorphs = [];
      if (meshesWithMorphTargets[0] && meshesWithMorphTargets[0].morphTargetDictionary) {
        availableMorphs.push(...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary));
      }
      
      console.log('Available morph targets for speak:', availableMorphs);
      
      const phonemes = ipaToPhonemes(ipaTranscription);
      console.log('Phonemes for animation:', phonemes);
      const phonemeDuration = 120 / animationSpeed;
      
      isAnimatingRef.current = true;
      setIsAnimating(true);
      let phonemeIndex = 0;
      let startTime = null;
      
      const animateSpeaking = () => {
        if (!isAnimatingRef.current) {
          resetMorphTargets();
          return;
        }
        
        if (!startTime) startTime = Date.now();
        const elapsed = Date.now() - startTime;
        
        const currentPhonemeIndex = Math.floor(elapsed / phonemeDuration);
        
        if (currentPhonemeIndex !== phonemeIndex && currentPhonemeIndex < phonemes.length) {
          phonemeIndex = currentPhonemeIndex;
          const phoneme = phonemes[phonemeIndex];
          const viseme = ipaToViseme[phoneme];
          
          const targetMorphs = {};
          
          if (viseme && phoneme !== '_pause') {
            const primaryMorph = findBestMorphMatch(viseme.primary, availableMorphs);
            if (primaryMorph) {
              targetMorphs[primaryMorph] = viseme.weight;
            }
            
            if (viseme.secondary && viseme.secondary.length > 0) {
              const secondaryMorph = findBestMorphMatch(viseme.secondary, availableMorphs);
              if (secondaryMorph) {
                targetMorphs[secondaryMorph] = viseme.secondaryWeight || 0.3;
              }
            }
          } else {
            const openMorph = findBestMorphMatch(['mouthOpen', 'A'], availableMorphs);
            if (openMorph) targetMorphs[openMorph] = 0.1;
          }
          
          smoothTransition(targetMorphs, 50);
        }
        
        if (window.speechSynthesis.speaking) {
          animationIdRef.current = requestAnimationFrame(animateSpeaking);
        } else {
          isAnimatingRef.current = false;
          setIsAnimating(false);
          resetMorphTargets();
        }
      };
      
      utterance.onstart = () => {
        startTime = Date.now();
        animateSpeaking();
      };
      
      utterance.onend = () => {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        stopAnimation();
        setTimeout(() => resetMorphTargets(), 200);
      };
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis not supported in this browser. Use "Animate" instead.');
    }
  }, [meshesWithMorphTargets, animationSpeed, stopAnimation, smoothTransition, resetMorphTargets]);

  return {
    isAnimating,
    animationSpeed,
    setAnimationSpeed,
    updateMorphTarget,
    resetMorphTargets,
    stopAnimation,
    animateText,
    speakText,
    animateIPA,
    speakIPA
  };
};
