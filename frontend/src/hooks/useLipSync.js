import { useState, useCallback, useRef, useEffect } from "react";

const TTS_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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

  /**
   * Selects the best available English voice, prioritizing neural/high-quality voices.
   * Priority order:
   *   1. Google US English (Chrome – very natural)
   *   2. Microsoft Neural voices (Edge – Aria, Jenny, Guy, etc.)
   *   3. Any Microsoft en-US voice
   *   4. Any en-US voice
   *   5. Any English voice
   *   6. System default (null)
   */
  const getBestEnglishVoice = useCallback(() => {
    const voices = voicesRef.current.length
      ? voicesRef.current
      : (window.speechSynthesis?.getVoices?.() || []);

    if (!voices.length) return null;

    // Tier 1 – Google US English (clearest in Chrome)
    const googleUS = voices.find(
      (v) => v.name === 'Google US English'
    );
    if (googleUS) return googleUS;

    // Tier 2 – Microsoft Neural voices (Edge – prioritise Aria/Jenny/Guy)
    const neuralNames = ['Aria', 'Jenny', 'Guy', 'Davis', 'Ana', 'Emma', 'Brian'];
    for (const name of neuralNames) {
      const neural = voices.find(
        (v) => v.name.includes('Microsoft') && v.name.includes(name) && v.lang.startsWith('en')
      );
      if (neural) return neural;
    }

    // Tier 3 – Any Microsoft en-US voice
    const msEnUS = voices.find(
      (v) => v.name.includes('Microsoft') && v.lang === 'en-US'
    );
    if (msEnUS) return msEnUS;

    // Tier 4 – Any en-US voice that is NOT "Google UK"
    const enUS = voices.find(
      (v) => v.lang === 'en-US' && !v.name.includes('UK')
    );
    if (enUS) return enUS;

    // Tier 5 – Any English voice
    const anyEnglish = voices.find((v) => v.lang.startsWith('en'));
    if (anyEnglish) return anyEnglish;

    return null;
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
        // Use the clearest available English voice
        const bestVoice = getBestEnglishVoice();
        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.lang = bestVoice.lang;
          console.log(`🎙️ speakText: using voice "${bestVoice.name}" (${bestVoice.lang})`);
        } else {
          utterance.lang = 'en-US';
        }
        utterance.rate = 0.85 * animationSpeed; // slightly faster than 0.8 – clearer rhythm
        utterance.pitch = 1.05;                  // tiny lift for natural clarity

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
      getBestEnglishVoice,
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

  /**
   * Shared animation runner used by both backend-audio and browser-fallback paths.
   * Drives lip-sync phoneme animation for a given real audio duration (ms).
   */
  /**
   * Measures the initial silence at the start of an audio blob so the lip sync
   * can start exactly when the voice begins rather than guessing a fixed offset.
   * Falls back to `defaultDelayMs` if the Web Audio API is unavailable.
   */
  const measureLeadingSilenceMs = useCallback(async (audioBlob, defaultDelayMs = 100) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      ctx.close();

      const channelData = decoded.getChannelData(0);
      const sampleRate = decoded.sampleRate;
      const SILENCE_THRESHOLD = 0.005;

      for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > SILENCE_THRESHOLD) {
          return Math.round((i / sampleRate) * 1000);
        }
      }
      return defaultDelayMs; // entire buffer is silent – shouldn't happen
    } catch {
      return defaultDelayMs; // API unavailable or decode error
    }
  }, []);

  const runLipSyncAnimation = useCallback(
    (phonemes, visemeMap, activeAudioDurationMs, availableMorphs) => {
      // activeAudioDurationMs is the duration of the *voiced* portion (silence already excluded)
      let totalPhonemeDuration = 0;
      phonemes.forEach((p) => {
        const v = visemeMap[p];
        totalPhonemeDuration += v ? (v.duration || 120) : 100;
      });

      // Leave an 80ms buffer before the audio end so the last phoneme
      // always completes cleanly without over-running.
      const targetDuration = Math.max(100, activeAudioDurationMs - 80);
      const scaleFactor = Math.max(
        0.25,
        Math.min(2.0, targetDuration / (totalPhonemeDuration || 1))
      );

      let phonemeIndex = 0;
      isAnimatingRef.current = true;
      setIsAnimating(true);

      const animateNextPhoneme = () => {
        if (!isAnimatingRef.current || phonemeIndex >= phonemes.length) {
          isAnimatingRef.current = false;
          setIsAnimating(false);
          smoothTransition({}, 120);
          return;
        }

        const phoneme = phonemes[phonemeIndex];
        const viseme = visemeMap[phoneme];

        if (phoneme === '_pause') {
          const targetMorphs = {};
          const openMorph = findBestMorphMatch(['Ah'], availableMorphs);
          if (openMorph) targetMorphs[openMorph] = 0.12;
          smoothTransition(targetMorphs, 70 / animationSpeed);
          phonemeIndex++;
          timeoutIdRef.current = setTimeout(
            animateNextPhoneme,
            (100 / animationSpeed) * scaleFactor
          );
          return;
        }

        if (viseme) {
          const targetMorphs = {};
          const primaryMorph = findBestMorphMatch(viseme.primary, availableMorphs);
          if (primaryMorph) targetMorphs[primaryMorph] = viseme.weight;

          if (viseme.secondary?.length > 0) {
            const secondaryMorph = findBestMorphMatch(viseme.secondary, availableMorphs);
            if (secondaryMorph)
              targetMorphs[secondaryMorph] = viseme.secondaryWeight || 0.3;
          }

          smoothTransition(targetMorphs, Math.min(55, 55 * scaleFactor));
          const duration = ((viseme.duration || 120) / animationSpeed) * scaleFactor;
          phonemeIndex++;
          timeoutIdRef.current = setTimeout(animateNextPhoneme, duration);
        } else {
          const targetMorphs = {};
          const genericMorph = findBestMorphMatch(['Ah'], availableMorphs);
          if (genericMorph) targetMorphs[genericMorph] = 0.25;
          smoothTransition(targetMorphs, 55 / animationSpeed);
          phonemeIndex++;
          timeoutIdRef.current = setTimeout(
            animateNextPhoneme,
            (100 / animationSpeed) * scaleFactor
          );
        }
      };

      animateNextPhoneme();
    },
    [meshesWithMorphTargets, animationSpeed, smoothTransition]
  );

  const speakIPA = useCallback(
    (word, ipaTranscription) => {
      console.log('=== SPEAK IPA (Edge TTS backend) ===');
      if (!word) return;

      const hasIPA = Boolean(ipaTranscription?.trim());
      const isSinhalaText = /[\u0D80-\u0DFF]/.test(word);

      // ── Build the phoneme list for animation ──────────────────────────────
      const phoneticWord = hasIPA ? ipaToPhoneticEnglish(ipaTranscription) : '';
      const sinhalaFallback = isSinhalaText ? sinhalaToLatinApprox(word) : '';
      const animationText = (
        isSinhalaText
          ? (sinhalaFallback || phoneticWord || word)
          : (phoneticWord || word)
      ).trim();

      const phonemes = hasIPA
        ? ipaToPhonemes(ipaTranscription)
        : textToPhonemes(animationText);
      const visemeMap = hasIPA ? ipaToViseme : phonemeToViseme;

      // ── Collect available morph targets ───────────────────────────────────
      const availableMorphs = [];
      if (meshesWithMorphTargets[0]?.morphTargetDictionary) {
        availableMorphs.push(
          ...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary)
        );
      }

      // ── Determine the text that should be spoken aloud ───────────────────
      // With Edge TTS neural voices, native Sinhala script is pronounced perfectly.
      // We only use the English phonetic form for English words.
      const ttsText = isSinhalaText
        ? word
        : (phoneticWord || word);
      const ttsLang = isSinhalaText ? 'sinhala' : 'english';

      stopAnimation();
      // Cancel any previous browser speech just in case
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();

      // ──────────────────────────────────────────────────────────────────────
      // PRIMARY PATH: Backend Edge TTS → precise lip sync
      // ──────────────────────────────────────────────────────────────────────
      const tryBackendTTS = async () => {
        try {
          const response = await fetch(`${TTS_API_BASE}/api/3d-models/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: ttsText, language: ttsLang }),
            signal: AbortSignal.timeout(8000),
          });

          if (!response.ok) throw new Error(`Backend TTS error: ${response.status}`);

          const audioBlob = await response.blob();

          // Measure the actual leading silence so we start the lip sync exactly
          // when the voice begins, not at a fixed offset.
          const leadingSilenceMs = await measureLeadingSilenceMs(audioBlob, 100);
          console.log(`🔇 Leading silence detected: ${leadingSilenceMs} ms`);

          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          window.__activeGTTSAudio = audio;

          await new Promise((resolve, reject) => {
            audio.onloadedmetadata = () => {
              const totalDurationMs = audio.duration * 1000;
              // The voiced portion is the total minus the leading silence and a small tail guard
              const voicedDurationMs = Math.max(100, totalDurationMs - leadingSilenceMs - 80);
              console.log(`🎙️ Edge TTS ready – total: ${totalDurationMs.toFixed(0)} ms | voiced: ${voicedDurationMs.toFixed(0)} ms`);

              audio.onplay = () => {
                console.log('▶️  Edge TTS playback started');
                const animationStartTime = Date.now();

                // Start lip sync after the measured leading silence
                setTimeout(() => {
                  console.log(`🎬 Lip sync starting after ${leadingSilenceMs} ms`);
                  runLipSyncAnimation(phonemes, visemeMap, voicedDurationMs, availableMorphs);
                }, leadingSilenceMs);

                // Force-stop guard: fires when the *entire* audio duration has elapsed
                // from the play event (independent of animation start delay).
                setTimeout(() => {
                  if (isAnimatingRef.current) {
                    console.log('⏹️  Force stopping animation (audio duration reached)');
                    isAnimatingRef.current = false;
                    setIsAnimating(false);
                    stopAnimation();
                    smoothTransition({}, 80);
                  }
                }, totalDurationMs - (Date.now() - animationStartTime) + 60);
              };

              audio.onended = () => {
                console.log('⏹️  Edge TTS playback finished');
                isAnimatingRef.current = false;
                setIsAnimating(false);
                stopAnimation();
                smoothTransition({}, 80);
                URL.revokeObjectURL(audioUrl);
                resolve();
              };

              audio.onerror = (e) => {
                console.error('❌ Audio playback error:', e);
                URL.revokeObjectURL(audioUrl);
                reject(e);
              };

              audio.play().catch(reject);
            };

            audio.onerror = (e) => {
              URL.revokeObjectURL(audioUrl);
              reject(e);
            };
          });

          return true; // success
        } catch (err) {
          console.warn('⚠️ Backend TTS failed, falling back to browser voice:', err.message);
          return false;
        }
      };

      // ──────────────────────────────────────────────────────────────────────
      // FALLBACK PATH: Best available browser voice (better than default)
      // ──────────────────────────────────────────────────────────────────────
      const useBrowserFallback = () => {
        if (!('speechSynthesis' in window)) {
          alert('Speech synthesis not supported in this browser.');
          return;
        }

        const voices = voicesRef.current.length
          ? voicesRef.current
          : window.speechSynthesis.getVoices?.() || [];
        const sinhalaVoice =
          voices.find((v) => (v.lang || '').toLowerCase().startsWith('si')) ||
          voices.find((v) => (v.name || '').toLowerCase().includes('sinhala'));

        const fallbackText = (
          isSinhalaText
            ? (sinhalaVoice ? word : (sinhalaFallback || phoneticWord || ''))
            : (phoneticWord || word || '')
        ).trim();

        if (!fallbackText) return;

        const utterance = new SpeechSynthesisUtterance(fallbackText);
        window.__activeUtterance = utterance;

        if (isSinhalaText && sinhalaVoice) {
          utterance.voice = sinhalaVoice;
          utterance.lang = sinhalaVoice.lang;
          utterance.rate = 0.75 * animationSpeed;
          utterance.pitch = 1.0;
        } else {
          const bestVoice = getBestEnglishVoice();
          if (bestVoice) {
            utterance.voice = bestVoice;
            utterance.lang = bestVoice.lang;
          } else {
            utterance.lang = 'en-US';
          }
          utterance.rate = 0.82 * animationSpeed;
          utterance.pitch = 1.05;
        }

        // Estimate duration for lip-sync
        const letters = fallbackText.replace(/[^A-Za-z\u0D80-\u0DFF]/g, '').length;
        const spaces = (fallbackText.match(/\s/g) || []).length;
        const estimatedMs = (letters * 78 + spaces * 130) / (utterance.rate || 0.82);

        utterance.onstart = () => {
          runLipSyncAnimation(phonemes, visemeMap, estimatedMs, availableMorphs);
        };
        utterance.onend = () => {
          isAnimatingRef.current = false;
          setIsAnimating(false);
          stopAnimation();
          smoothTransition({}, 80);
        };
        utterance.onerror = (e) => {
          console.error('❌ Fallback speech error:', e);
          isAnimatingRef.current = false;
          setIsAnimating(false);
          stopAnimation();
          smoothTransition({}, 100);
        };

        window.speechSynthesis.speak(utterance);
      };

      // Try backend first; if it fails use the browser voice
      tryBackendTTS().then((ok) => { if (!ok) useBrowserFallback(); });
    },
    [
      meshesWithMorphTargets,
      animationSpeed,
      stopAnimation,
      smoothTransition,
      getBestEnglishVoice,
      runLipSyncAnimation,
      measureLeadingSilenceMs,
    ]
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
