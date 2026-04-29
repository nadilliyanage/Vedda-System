import { useState, useCallback, useRef, useEffect } from "react";
import Speech from "speak-tts";
import {
  phonemeToViseme,
  ipaToViseme,
  findBestMorphMatch,
  textToPhonemes,
  ipaToPhonemes,
  ipaToPhoneticEnglish,
  sinhalaToLatinApprox,
} from "../utils/lipSyncUtils";

export const useLipSync = (meshesWithMorphTargets) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const animationIdRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const speechRef = useRef(null);
  const voicesRef = useRef([]);

  // Initialize the speech engine
  useEffect(() => {
    const speech = new Speech();
    speech
      .init({
        volume: 1,
        lang: "en-US",
        rate: 1,
        pitch: 1,
        // 'voice': 'Google UK English Male',
        splitSentences: true,
      })
      .then((data) => {
        console.log("✅ Speech-TTS engine initialized", data);
        speechRef.current = speech;
        // speechRef.current.setVoice('Google UK English Male');
      })
      .catch((e) => {
        console.error("❌ An error occurred while initializing Speech-TTS:", e);
      });

    return () => {
      // Cleanup if necessary
    };
  }, []);

  // Cache browser voices (they often load asynchronously)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      try {
        voicesRef.current = window.speechSynthesis.getVoices() || [];
      } catch {
        voicesRef.current = [];
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  const updateMorphTarget = useCallback(
    (name, value) => {
      meshesWithMorphTargets.forEach((mesh) => {
        if (mesh.morphTargetDictionary && name in mesh.morphTargetDictionary) {
          const index = mesh.morphTargetDictionary[name];
          mesh.morphTargetInfluences[index] = value;
        }
      });
    },
    [meshesWithMorphTargets],
  );

  const smoothTransition = useCallback(
    (targetMorphs, duration = 100) => {
      const startValues = {};

      // Store current values
      meshesWithMorphTargets.forEach((mesh) => {
        if (mesh.morphTargetDictionary) {
          Object.keys(mesh.morphTargetDictionary).forEach((name) => {
            const index = mesh.morphTargetDictionary[name];
            startValues[name] = mesh.morphTargetInfluences[index];
          });
        }
      });

      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpolate all morph targets
        meshesWithMorphTargets.forEach((mesh) => {
          if (mesh.morphTargetDictionary) {
            Object.keys(mesh.morphTargetDictionary).forEach((name) => {
              const index = mesh.morphTargetDictionary[name];
              const start = startValues[name] || 0;
              const target = targetMorphs[name] || 0;
              mesh.morphTargetInfluences[index] =
                start + (target - start) * eased;
            });
          }
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    },
    [meshesWithMorphTargets],
  );

  const resetMorphTargets = useCallback(() => {
    meshesWithMorphTargets.forEach((mesh) => {
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
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const animateText = useCallback(
    (text, onPhonemeChange) => {
      if (!text || meshesWithMorphTargets.length === 0) return;

      stopAnimation();
      isAnimatingRef.current = true;
      setIsAnimating(true);

      const availableMorphs = [];
      if (
        meshesWithMorphTargets[0] &&
        meshesWithMorphTargets[0].morphTargetDictionary
      ) {
        availableMorphs.push(
          ...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary),
        );
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

        if (phoneme === "_pause") {
          const targetMorphs = {};
          const openMorph = findBestMorphMatch(["Ah"], availableMorphs);
          if (openMorph) targetMorphs[openMorph] = 0.15;
          smoothTransition(targetMorphs, 80 / animationSpeed);
          phonemeIndex++;
          timeoutIdRef.current = setTimeout(animateNextPhoneme, 100 / animationSpeed);
          return;
        }

        const viseme = phonemeToViseme[phoneme];

        if (viseme) {
          const targetMorphs = {};

          const primaryMorph = findBestMorphMatch(
            viseme.primary,
            availableMorphs,
          );
          if (primaryMorph) {
            targetMorphs[primaryMorph] = viseme.weight;
          }

          if (viseme.secondary && viseme.secondary.length > 0) {
            const secondaryMorph = findBestMorphMatch(
              viseme.secondary,
              availableMorphs,
            );
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
          timeoutIdRef.current = setTimeout(animateNextPhoneme, duration);
        } else {
          const targetMorphs = {};
          const genericMorph = findBestMorphMatch(["Ah"], availableMorphs);
          if (genericMorph) targetMorphs[genericMorph] = 0.3;
          smoothTransition(targetMorphs, 60 / animationSpeed);

          phonemeIndex++;
          timeoutIdRef.current = setTimeout(animateNextPhoneme, 100 / animationSpeed);
        }
      };

      animateNextPhoneme();
    },
    [meshesWithMorphTargets, animationSpeed, stopAnimation, smoothTransition],
  );

  const speakText = useCallback(
    (text) => {
      if (!text || meshesWithMorphTargets.length === 0) return;

      stopAnimation();

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8 * animationSpeed;
        utterance.pitch = 1;

        const availableMorphs = [];
        if (
          meshesWithMorphTargets[0] &&
          meshesWithMorphTargets[0].morphTargetDictionary
        ) {
          availableMorphs.push(
            ...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary),
          );
        }

        const phonemes = textToPhonemes(text);

        // Adjust phoneme duration based on speech rate
        const basePhoneDuration = 100; // Base duration per phoneme in ms
        const phonemeDuration = basePhoneDuration / (utterance.rate || 0.8);

        isAnimatingRef.current = true;
        setIsAnimating(true);
        let phonemeIndex = 0;
        let startTime = null;
        let hasEnded = false;
        let speechEndTime = null;
        let isSpeaking = false;

        const animateSpeaking = () => {
          if (!isAnimatingRef.current || hasEnded) {
            return;
          }

          if (!startTime) startTime = Date.now();
          const elapsed = Date.now() - startTime;

          // Stop animation immediately if speech has ended
          if (!isSpeaking && speechEndTime && elapsed >= speechEndTime + 50) {
            hasEnded = true;
            isAnimatingRef.current = false;
            setIsAnimating(false);
            if (animationIdRef.current) {
              cancelAnimationFrame(animationIdRef.current);
              animationIdRef.current = null;
            }
            smoothTransition({}, 150);
            return;
          }

          // Check if browser speech synthesis is still actually speaking
          if (isSpeaking && !window.speechSynthesis.speaking) {
            console.log("⏹️ Speech synthesis stopped unexpectedly");
            isSpeaking = false;
            speechEndTime = elapsed;
          }

          // Don't advance phonemes if speech has ended
          if (isSpeaking) {
            // Use modulo so phonemes cycle continuously until speech actually ends
            const currentPhonemeIndex =
              Math.floor(elapsed / phonemeDuration) % phonemes.length;

            // Only update when we move to a new phoneme
            if (currentPhonemeIndex !== phonemeIndex) {
              phonemeIndex = currentPhonemeIndex;
              const phoneme = phonemes[phonemeIndex];
              const viseme = phonemeToViseme[phoneme];

              const targetMorphs = {};

              if (viseme && phoneme !== "_pause") {
                const primaryMorph = findBestMorphMatch(
                  viseme.primary,
                  availableMorphs,
                );
                if (primaryMorph) {
                  targetMorphs[primaryMorph] = viseme.weight;
                }

                if (viseme.secondary && viseme.secondary.length > 0) {
                  const secondaryMorph = findBestMorphMatch(
                    viseme.secondary,
                    availableMorphs,
                  );
                  if (secondaryMorph) {
                    targetMorphs[secondaryMorph] = viseme.secondaryWeight || 0.3;
                  }
                }
              } else {
                const openMorph = findBestMorphMatch(["Ah"], availableMorphs);
                if (openMorph) targetMorphs[openMorph] = 0.1;
              }

              smoothTransition(targetMorphs, 30); // Snappier transitions
            }
          }

          if (isAnimatingRef.current && !hasEnded) {
            animationIdRef.current = requestAnimationFrame(animateSpeaking);
          }
        };

        utterance.onstart = () => {
          startTime = Date.now();
          hasEnded = false;
          isSpeaking = true;
          speechEndTime = null;
          animateSpeaking();
        };

        utterance.onend = () => {
          const actualDuration = startTime ? Date.now() - startTime : 0;
          console.log(`✅ Speech ended - Actual: ${actualDuration} ms`);
          isSpeaking = false;
          speechEndTime = actualDuration;
          
          // Allow a brief moment for final transition, then stop
          setTimeout(() => {
            hasEnded = true;
            isAnimatingRef.current = false;
            setIsAnimating(false);
            if (animationIdRef.current) {
              cancelAnimationFrame(animationIdRef.current);
              animationIdRef.current = null;
            }
            // Smooth transition to neutral position
            smoothTransition({}, 80);
          }, 50);
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } else {
        alert(
          'Speech synthesis not supported in this browser. Use "Animate Mouth" instead.',
        );
      }
    },
    [
      meshesWithMorphTargets,
      animationSpeed,
      stopAnimation,
      smoothTransition,
      resetMorphTargets,
    ],
  );

  const animateIPA = useCallback(
    (ipaTranscription, onPhonemeChange) => {
      console.log("animateIPA called with:", ipaTranscription);
      if (!ipaTranscription || meshesWithMorphTargets.length === 0) {
        console.log("animateIPA blocked:", {
          ipaTranscription,
          meshCount: meshesWithMorphTargets.length,
        });
        return;
      }

      stopAnimation();
      isAnimatingRef.current = true;
      setIsAnimating(true);

      const availableMorphs = [];
      if (
        meshesWithMorphTargets[0] &&
        meshesWithMorphTargets[0].morphTargetDictionary
      ) {
        availableMorphs.push(
          ...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary),
        );
      }

      console.log("Available morph targets:", availableMorphs);

      const phonemes = ipaToPhonemes(ipaTranscription);
      console.log("Phonemes from IPA:", phonemes);
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

        if (phoneme === "_pause") {
          const targetMorphs = {};
          const openMorph = findBestMorphMatch(["Ah"], availableMorphs);
          if (openMorph) targetMorphs[openMorph] = 0.15;
          smoothTransition(targetMorphs, 80 / animationSpeed);
          phonemeIndex++;
          timeoutIdRef.current = setTimeout(animateNextPhoneme, 100 / animationSpeed);
          return;
        }

        const viseme = ipaToViseme[phoneme];

        if (viseme) {
          const targetMorphs = {};

          const primaryMorph = findBestMorphMatch(
            viseme.primary,
            availableMorphs,
          );
          if (primaryMorph) {
            targetMorphs[primaryMorph] = viseme.weight;
          }

          if (viseme.secondary && viseme.secondary.length > 0) {
            const secondaryMorph = findBestMorphMatch(
              viseme.secondary,
              availableMorphs,
            );
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
          timeoutIdRef.current = setTimeout(animateNextPhoneme, duration);
        } else {
          const targetMorphs = {};
          const genericMorph = findBestMorphMatch(["Ah"], availableMorphs);
          if (genericMorph) targetMorphs[genericMorph] = 0.3;
          smoothTransition(targetMorphs, 60 / animationSpeed);

          phonemeIndex++;
          timeoutIdRef.current = setTimeout(animateNextPhoneme, 100 / animationSpeed);
        }
      };

      animateNextPhoneme();
    },
    [meshesWithMorphTargets, animationSpeed, stopAnimation, smoothTransition],
  );

  // const speakIPA = useCallback((word, ipaTranscription) => {
  //   console.log('=== SPEAK IPA (speak-tts) ===');
  //   console.log('Original word:', word);
  //   console.log('IPA:', ipaTranscription);

  //   if (!speechRef.current) {
  //     console.error('❌ Speech-TTS engine not initialized.');
  //     alert('The speech engine is not ready yet. Please try again in a moment.');
  //     return;
  //   }

  //   if (!word || !ipaTranscription || meshesWithMorphTargets.length === 0) {
  //     console.log('❌ Blocked - missing data');
  //     return;
  //   }

  //   stopAnimation();
  //   speechRef.current.cancel(); // Stop any previous speech

  //   const availableMorphs = [];
  //   if (meshesWithMorphTargets[0] && meshesWithMorphTargets[0].morphTargetDictionary) {
  //     availableMorphs.push(...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary));
  //   }

  //   const phonemes = ipaToPhonemes(ipaTranscription);
  //   console.log('Phonemes:', phonemes);
  //   console.log('Phoneme count:', phonemes.length);

  //   // Convert IPA to phonetic English for TTS
  //   const phoneticWord = ipaToPhoneticEnglish(ipaTranscription);
  //   console.log('Phonetic word for TTS:', phoneticWord);

  //   isAnimatingRef.current = true;
  //   setIsAnimating(true);
  //   let phonemeIndex = 0;
  //   let startTime = null;
  //   let hasEnded = false;
  //   let animationFrameId = null;

  //   // Estimate duration based on phonetic word length
  //   const msPerChar = 130;
  //   const estimatedDuration = phoneticWord.length * msPerChar;

  //   console.log('Estimated duration:', estimatedDuration, 'ms for', phoneticWord.length, 'characters');

  //   const animateSpeaking = () => {
  //     if (!isAnimatingRef.current || hasEnded) {
  //       if (animationFrameId) cancelAnimationFrame(animationFrameId);
  //       return;
  //     }

  //     if (!startTime) {
  //       startTime = Date.now();
  //     }

  //     const elapsed = Date.now() - startTime;
  //     const progress = Math.min(elapsed / estimatedDuration, 0.99);
  //     const currentIndex = Math.floor(progress * phonemes.length);

  //     if (currentIndex !== phonemeIndex && currentIndex < phonemes.length) {
  //       phonemeIndex = currentIndex;
  //       const phoneme = phonemes[phonemeIndex];
  //       const viseme = ipaToViseme[phoneme];

  //       console.log(`🎬 Frame ${phonemeIndex + 1}/${phonemes.length}: ${phoneme} (${elapsed}ms, ${(progress * 100).toFixed(1)}%)`);

  //       const targetMorphs = {};
  //       if (viseme && phoneme !== '_pause') {
  //         const primaryMorph = findBestMorphMatch(viseme.primary, availableMorphs);
  //         if (primaryMorph) {
  //           targetMorphs[primaryMorph] = viseme.weight;
  //           console.log(`  → ${primaryMorph} = ${viseme.weight}`);
  //         }

  //         if (viseme.secondary && viseme.secondary.length > 0) {
  //           const secondaryMorph = findBestMorphMatch(viseme.secondary, availableMorphs);
  //           if (secondaryMorph) {
  //             targetMorphs[secondaryMorph] = viseme.secondaryWeight || 0.3;
  //             console.log(`  → ${secondaryMorph} = ${viseme.secondaryWeight || 0.3}`);
  //           }
  //         }
  //       } else {
  //         const openMorph = findBestMorphMatch(['Ah'], availableMorphs);
  //         if (openMorph) {
  //           targetMorphs[openMorph] = 0.2;
  //           console.log(`  → ${openMorph} = 0.2 (default)`);
  //         }
  //       }
  //       smoothTransition(targetMorphs, 50);
  //     }

  //     if (!hasEnded) {
  //       animationFrameId = requestAnimationFrame(animateSpeaking);
  //     }
  //   };

  //   // CRITICAL FIX: Speak the phonetic English version, not Sinhala or raw IPA!
  //   speechRef.current.speak({
  //     text: phoneticWord, // ← Use phonetic English approximation
  //     queue: false,
  //     listeners: {
  //       onstart: () => {
  //         console.log("✅ Speech started");
  //         console.log("   Speaking:", phoneticWord);
  //         console.log("   Original word:", word);
  //         console.log("   Animating with IPA:", ipaTranscription);
  //         startTime = Date.now();
  //         hasEnded = false;
  //         animateSpeaking();
  //       },
  //       onend: () => {
  //         const duration = startTime ? (Date.now() - startTime) : 0;
  //         console.log("✅ Speech ended");
  //         console.log("   Actual duration:", duration, "ms");

  //         if (duration < 100) {
  //           console.warn("⚠️ Speech ended very quickly - may have failed");
  //           console.warn("   This can happen with non-English characters");
  //         }

  //         hasEnded = true;
  //         isAnimatingRef.current = false;
  //         setIsAnimating(false);
  //         if (animationFrameId) {
  //           cancelAnimationFrame(animationFrameId);
  //         }
  //         smoothTransition({}, 150);
  //       },
  //       onerror: (e) => {
  //         console.error("❌ Speech error:", e);
  //         hasEnded = true;
  //         isAnimatingRef.current = false;
  //         setIsAnimating(false);
  //         if (animationFrameId) {
  //           cancelAnimationFrame(animationFrameId);
  //         }
  //         smoothTransition({}, 100);
  //       }
  //     }
  //   }).catch(e => {
  //     console.error("❌ Error while speaking:", e);
  //     hasEnded = true;
  //     isAnimatingRef.current = false;
  //     setIsAnimating(false);
  //   });

  // }, [meshesWithMorphTargets, stopAnimation, smoothTransition]);

  const speakIPA = useCallback(
    (word, ipaTranscription) => {
      console.log("=== SPEAK IPA (speak-tts) ===");
      console.log("Original word:", word);
      console.log("IPA:", ipaTranscription);

      if (!("speechSynthesis" in window)) {
        alert("Speech synthesis not supported in this browser.");
        return;
      }

      if (!speechRef.current) {
        console.warn(
          "Speech-TTS engine not initialized; using browser speechSynthesis directly.",
        );
      }

      if (!word) {
        console.log("❌ Blocked - missing data", {
          hasWord: Boolean(word),
        });
        return;
      }

      const hasIPA = Boolean(ipaTranscription && ipaTranscription.trim());

      const canAnimate = meshesWithMorphTargets.length > 0;

      const isSinhalaText = /[\u0D80-\u0DFF]/.test(word);
      const voices = voicesRef.current.length
        ? voicesRef.current
        : (window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : []);
      const sinhalaVoice =
        voices.find((v) => (v.lang || "").toLowerCase().startsWith("si")) ||
        voices.find((v) => (v.name || "").toLowerCase().includes("sinhala"));

      const phoneticWord = hasIPA ? ipaToPhoneticEnglish(ipaTranscription) : '';
      console.log("Phonetic word for TTS:", phoneticWord);

      // Prefer speaking actual Sinhala script when we have a Sinhala voice.
      // If we DON'T have a Sinhala voice, Sinhala->Latin approximation usually sounds
      // more like a real word on English voices than IPA-derived strings.
      const sinhalaFallback = (isSinhalaText && !sinhalaVoice)
        ? sinhalaToLatinApprox(word)
        : '';

      const speechText = (
        isSinhalaText
          ? (sinhalaVoice ? word : (sinhalaFallback || phoneticWord || ''))
          : (phoneticWord || word || '')
      ).trim();
      if (!speechText) {
        console.warn("Blocked - no speech text", {
          isSinhalaText,
          hasSinhalaVoice: Boolean(sinhalaVoice),
          hasIPA,
          sinhalaFallback,
          phoneticWord,
        });
        isAnimatingRef.current = false;
        setIsAnimating(false);
        return;
      }

      stopAnimation();
      speechRef.current?.cancel?.();
      window.speechSynthesis.cancel();

      // If morph-target meshes aren't ready yet, still speak (just skip lip animation).
      if (!canAnimate) {
        console.warn('Meshes not ready; speaking without lip animation');

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.8 * animationSpeed;
        utterance.pitch = 1;

        if (isSinhalaText && sinhalaVoice) {
          utterance.voice = sinhalaVoice;
          utterance.lang = sinhalaVoice.lang;
        } else {
          utterance.lang = (isSinhalaText && !sinhalaFallback) ? 'si-LK' : 'en-US';
        }

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return;
      }

      const availableMorphs = [];
      if (
        meshesWithMorphTargets[0] &&
        meshesWithMorphTargets[0].morphTargetDictionary
      ) {
        availableMorphs.push(
          ...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary),
        );
      }

      // Build animation phoneme stream.
      // IMPORTANT: If we are forced to speak a Latin fallback (no Sinhala voice),
      // animate from the same speechText so mouth shapes match what users hear.
      const animateFromIPA = hasIPA && (isSinhalaText ? Boolean(sinhalaVoice) : true) && speechText === word;
      const phonemes = animateFromIPA
        ? ipaToPhonemes(ipaTranscription)
        : textToPhonemes(speechText);
      const visemeMap = animateFromIPA ? ipaToViseme : phonemeToViseme;
      console.log("Phonemes:", phonemes);

      const utteranceRate = 0.8 * animationSpeed;
      const estimateSpeechDurationMs = (text, rate) => {
        const r = rate && rate > 0 ? rate : 1;
        const nonSpace = (text || '').replace(/\s+/g, '');
        const asciiLetters = (text || '').replace(/[^A-Za-z]/g, '').length;
        const spaces = ((text || '').match(/\s+/g) || []).length;

        // Heuristic: for Latin-ish text, letters dominate.
        // For Sinhala script or mixed content, fall back to non-space length.
        const baseUnits = asciiLetters > 0 ? asciiLetters : nonSpace.length;
        const baseMs = baseUnits * 85 + spaces * 140;
        const scaled = baseMs / r;
        return Math.max(350, Math.min(15000, Math.round(scaled)));
      };


      // BUILD TIMELINE FROM PHONEME DURATIONS
      const phonemeTimeline = [];
      let cumulativeTime = 0;
      phonemes.forEach((phoneme) => {
        const viseme = visemeMap[phoneme] || (phoneme === '_pause' ? ipaToViseme._pause : undefined);
        const baseDuration = viseme ? (viseme.duration || 120) : 70;
        const duration = baseDuration / (utteranceRate || 1);
        phonemeTimeline.push({
          phoneme,
          viseme,
          startTime: cumulativeTime,
          duration,
        });
        cumulativeTime += duration;
      });

      // Scale the timeline to match the estimated utterance duration for the chosen speechText.
      // This improves sync across different voices and fallback strategies.
      const estimatedSpeechDuration = estimateSpeechDurationMs(speechText, utteranceRate);
      const rawTimelineDuration = cumulativeTime || 1;
      const timelineScale = Math.max(0.6, Math.min(1.6, estimatedSpeechDuration / rawTimelineDuration));
      let dynamicTimelineScale = timelineScale;
      let boundaryEventCount = 0;

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      console.log("Timeline built:", phonemeTimeline);
      console.log("Raw timeline duration:", cumulativeTime, "ms");
      console.log("Estimated speech duration:", estimatedSpeechDuration, "ms");
      console.log("Timeline scale:", timelineScale);
      console.log("Animation speed:", animationSpeed);

      const nowMs = () =>
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();

      isAnimatingRef.current = true;
      setIsAnimating(true);
      let currentPhonemeIndex = -1;
      let startTime = null;
      let hasEnded = false;
      let animationFrameId = null;
      let speechEndTime = null; // Track when speech actually ended
      let isSpeaking = false; // Track if speech is currently active

      const animateSpeaking = () => {
        if (!isAnimatingRef.current || hasEnded) {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          return;
        }

        if (!startTime) {
          startTime = nowMs();
        }

        const elapsed = nowMs() - startTime;

        // If the engine stops speaking but onend is delayed, stop ASAP.
        if (isSpeaking && !window.speechSynthesis.speaking) {
          console.log("⏹️ speechSynthesis.speaking=false (early stop)");
          isSpeaking = false;
          speechEndTime = elapsed;
        }

        // Stop animation if speech has ended and we've given time for final transition
        if (speechEndTime && elapsed >= speechEndTime + 50) {
          console.log("⏹️ Stopping animation - speech ended");
          hasEnded = true;
          isAnimatingRef.current = false;
          setIsAnimating(false);
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          smoothTransition({}, 100); // Faster mouth close
          return;
        }

        // Don't advance to new phonemes after speech has ended
        if (!isSpeaking && speechEndTime) {
          if (!hasEnded) {
            animationFrameId = requestAnimationFrame(animateSpeaking);
          }
          return;
        }

        // FIND THE CORRECT PHONEME BASED ON TIMELINE (NOT LINEAR PROGRESS!)
        let targetPhonemeIndex = currentPhonemeIndex;
        for (let i = 0; i < phonemeTimeline.length; i++) {
          const phonemeData = phonemeTimeline[i];
          const scaledStart = phonemeData.startTime * dynamicTimelineScale;
          const scaledEnd = scaledStart + phonemeData.duration * dynamicTimelineScale;
          if (
            elapsed >= scaledStart &&
            elapsed < scaledEnd
          ) {
            targetPhonemeIndex = i;
            break;
          } else if (elapsed >= scaledEnd) {
            targetPhonemeIndex = Math.min(i + 1, phonemeTimeline.length - 1);
          }
        }

        // UPDATE MORPH TARGETS WHEN SWITCHING PHONEMES
        if (
          targetPhonemeIndex !== currentPhonemeIndex &&
          targetPhonemeIndex < phonemeTimeline.length
        ) {
          currentPhonemeIndex = targetPhonemeIndex;
          const phonemeData = phonemeTimeline[currentPhonemeIndex];
          const phoneme = phonemeData.phoneme;
          const viseme = phonemeData.viseme;

          console.log(
            `🎬 ${currentPhonemeIndex + 1}/${phonemeTimeline.length}: ${phoneme} at ${elapsed}ms`,
          );

          const targetMorphs = {};
          if (phoneme === "_pause") {
            // Prefer explicit silence morphs (e.g., 'sil') when present; otherwise return to neutral.
            const silenceMorph = findBestMorphMatch(["_pause"], availableMorphs);
            if (silenceMorph) {
              targetMorphs[silenceMorph] = 1.0;
            }
          } else if (viseme) {
            const primaryMorph = findBestMorphMatch(
              viseme.primary,
              availableMorphs,
            );
            if (primaryMorph) {
              targetMorphs[primaryMorph] = viseme.weight;
              console.log(`  → ${primaryMorph} = ${viseme.weight}`);
            }

            if (viseme.secondary && viseme.secondary.length > 0) {
              const secondaryMorph = findBestMorphMatch(
                viseme.secondary,
                availableMorphs,
              );
              if (secondaryMorph) {
                targetMorphs[secondaryMorph] = viseme.secondaryWeight || 0.3;
              }
            }
          } else {
            const openMorph = findBestMorphMatch(["Ah"], availableMorphs);
            if (openMorph) {
              targetMorphs[openMorph] = 0.2;
            }
          }

          smoothTransition(targetMorphs, 30); // Snappier transition for better sync
        }

        if (!hasEnded) {
          animationFrameId = requestAnimationFrame(animateSpeaking);
        }
      };

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = utteranceRate;
      utterance.pitch = 1;

      if (isSinhalaText && sinhalaVoice) {
        utterance.voice = sinhalaVoice;
        utterance.lang = sinhalaVoice.lang;
      } else {
        // Hint Sinhala even when we don't have an explicit Sinhala voice selected.
        // Some platforms will still pick a better default voice based on lang.
        // If we fell back to Latin transliteration, keep en-US.
        utterance.lang = (isSinhalaText && !sinhalaFallback) ? 'si-LK' : 'en-US';
      }

      utterance.onstart = () => {
        console.log("✅ Speech started");
        startTime = nowMs();
        hasEnded = false;
        isSpeaking = true;
        speechEndTime = null;
        animateSpeaking();
      };

      // Boundary events (word/character) allow us to auto-correct drift.
      // Note: Some browsers fire only word boundaries; still useful to reduce long-term drift.
      utterance.onboundary = (event) => {
        boundaryEventCount++;

        // Prefer engine-provided elapsedTime when available; otherwise use our clock.
        const elapsedMs =
          typeof event.elapsedTime === 'number'
            ? Math.max(0, Math.round(event.elapsedTime * 1000))
            : (startTime ? nowMs() - startTime : null);

        const textLen = (speechText || '').length;
        const charIndex = typeof event.charIndex === 'number' ? event.charIndex : null;
        const charLength = typeof event.charLength === 'number' ? event.charLength : 0;
        if (elapsedMs == null || !textLen || charIndex == null) return;

        const progress = clamp((charIndex + charLength) / textLen, 0, 1);
        // Avoid noisy early/late updates.
        if (progress < 0.05 || progress > 0.97) return;

        const expectedAtProgress = rawTimelineDuration * progress;
        if (expectedAtProgress < 80) return;

        const suggestedScale = elapsedMs / expectedAtProgress;
        // Smooth the correction to avoid jitter, but react fast enough to be noticeable.
        dynamicTimelineScale = clamp(
          dynamicTimelineScale * 0.55 + suggestedScale * 0.45,
          0.45,
          2.2,
        );

        if (boundaryEventCount <= 5) {
          console.log('🧭 boundary', {
            name: event.name,
            charIndex,
            charLength,
            elapsedMs,
            progress: Number(progress.toFixed(3)),
            suggestedScale: Number(suggestedScale.toFixed(3)),
            dynamicTimelineScale: Number(dynamicTimelineScale.toFixed(3)),
          });
        }
      };

      utterance.onend = () => {
        const duration = startTime ? nowMs() - startTime : 0;
        console.log(
          "✅ Speech ended - Actual:",
          duration,
          "ms | Expected:",
          cumulativeTime,
          "ms",
        );

        isSpeaking = false;
        speechEndTime = duration;

        setTimeout(() => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          hasEnded = true;
          stopAnimation();
          smoothTransition({}, 80);
        }, 50);
      };

      utterance.onerror = (e) => {
        console.error("❌ Speech error:", e);
        isSpeaking = false;
        hasEnded = true;
        stopAnimation();
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        smoothTransition({}, 100);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [meshesWithMorphTargets, animationSpeed, stopAnimation, smoothTransition],
  );

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
    speakIPA,
  };
};
