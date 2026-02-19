import { useState, useCallback, useRef, useEffect } from "react";
import Speech from "speak-tts";
import {
  phonemeToViseme,
  ipaToViseme,
  findBestMorphMatch,
  textToPhonemes,
  ipaToPhonemes,
  ipaToPhoneticEnglish,
} from "../utils/lipSyncUtils";

export const useLipSync = (meshesWithMorphTargets) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const animationIdRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const speechRef = useRef(null);

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
          setTimeout(animateNextPhoneme, 100 / animationSpeed);
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
          setTimeout(animateNextPhoneme, duration);
        } else {
          const targetMorphs = {};
          const genericMorph = findBestMorphMatch(["Ah"], availableMorphs);
          if (genericMorph) targetMorphs[genericMorph] = 0.3;
          smoothTransition(targetMorphs, 60 / animationSpeed);

          phonemeIndex++;
          setTimeout(animateNextPhoneme, 100 / animationSpeed);
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

        // Calculate total expected duration based on adjusted phoneme duration
        const totalPhonemes = phonemes.length;
        const expectedDuration = totalPhonemes * phonemeDuration;

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

          // Stop animation if we've exceeded expected duration or speech has ended
          if (elapsed >= expectedDuration && !isSpeaking) {
            hasEnded = true;
            isAnimatingRef.current = false;
            setIsAnimating(false);
            if (animationIdRef.current) {
              cancelAnimationFrame(animationIdRef.current);
              animationIdRef.current = null;
            }
            // Smoothly transition to closed mouth
            smoothTransition({}, 80);
            return;
          }

          // Don't advance phonemes if speech has ended
          if (isSpeaking) {
            const currentPhonemeIndex = Math.floor(elapsed / phonemeDuration);

            // Only update when we move to a new phoneme
            if (
              currentPhonemeIndex !== phonemeIndex &&
              currentPhonemeIndex < phonemes.length
            ) {
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
          const duration = startTime ? Date.now() - startTime : 0;
          isSpeaking = false;
          speechEndTime = duration;
          
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
          setTimeout(animateNextPhoneme, 100 / animationSpeed);
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
          setTimeout(animateNextPhoneme, duration);
        } else {
          const targetMorphs = {};
          const genericMorph = findBestMorphMatch(["Ah"], availableMorphs);
          if (genericMorph) targetMorphs[genericMorph] = 0.3;
          smoothTransition(targetMorphs, 60 / animationSpeed);

          phonemeIndex++;
          setTimeout(animateNextPhoneme, 100 / animationSpeed);
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

      if (!speechRef.current) {
        console.error("❌ Speech-TTS engine not initialized.");
        alert(
          "The speech engine is not ready yet. Please try again in a moment.",
        );
        return;
      }

      if (!word || !ipaTranscription || meshesWithMorphTargets.length === 0) {
        console.log("❌ Blocked - missing data");
        return;
      }

      stopAnimation();
      speechRef.current.cancel();

      const availableMorphs = [];
      if (
        meshesWithMorphTargets[0] &&
        meshesWithMorphTargets[0].morphTargetDictionary
      ) {
        availableMorphs.push(
          ...Object.keys(meshesWithMorphTargets[0].morphTargetDictionary),
        );
      }

      const phonemes = ipaToPhonemes(ipaTranscription);
      console.log("Phonemes:", phonemes);

      const phoneticWord = ipaToPhoneticEnglish(ipaTranscription);
      console.log("Phonetic word for TTS:", phoneticWord);

      // Set speech rate based on animation speed
      if (speechRef.current.setRate) {
        speechRef.current.setRate(0.8 * animationSpeed);
      }

      // BUILD TIMELINE FROM IPA PHONEME DURATIONS (THE KEY FIX!)
      const phonemeTimeline = [];
      let cumulativeTime = 0;
      phonemes.forEach((phoneme) => {
        const viseme = ipaToViseme[phoneme];
        // Apply speed control: reduce duration by 20% for tighter sync, then adjust by animationSpeed
        const baseDuration = viseme ? (viseme.duration || 120) * 0.8 : 80;
        const duration = baseDuration / animationSpeed;
        phonemeTimeline.push({
          phoneme,
          viseme,
          startTime: cumulativeTime,
          duration,
        });
        cumulativeTime += duration;
      });

      console.log("Timeline built:", phonemeTimeline);
      console.log("Total expected duration:", cumulativeTime, "ms");
      console.log("Animation speed:", animationSpeed);

      isAnimatingRef.current = true;
      setIsAnimating(true);
      let currentPhonemeIndex = 0;
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
          startTime = Date.now();
        }

        const elapsed = Date.now() - startTime;

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
          if (
            elapsed >= phonemeData.startTime &&
            elapsed < phonemeData.startTime + phonemeData.duration
          ) {
            targetPhonemeIndex = i;
            break;
          } else if (elapsed >= phonemeData.startTime + phonemeData.duration) {
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
          if (viseme && phoneme !== "_pause") {
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

      speechRef.current
        .speak({
          text: phoneticWord,
          queue: false,
          listeners: {
            onstart: () => {
              console.log("✅ Speech started");
              startTime = Date.now();
              hasEnded = false;
              isSpeaking = true;
              speechEndTime = null;
              animateSpeaking();
            },
            onend: () => {
              const duration = startTime ? Date.now() - startTime : 0;
              console.log(
                "✅ Speech ended - Actual:",
                duration,
                "ms | Expected:",
                cumulativeTime,
                "ms",
              );

              // Mark speech as ended immediately
              isSpeaking = false;
              speechEndTime = duration;
              
              // Allow animation loop to catch the end naturally
              // It will stop within 50ms after checking speechEndTime
              setTimeout(() => {
                if (animationFrameId) {
                  cancelAnimationFrame(animationFrameId);
                  animationFrameId = null;
                }
                hasEnded = true;
                isAnimatingRef.current = false;
                setIsAnimating(false);
                smoothTransition({}, 80);
              }, 50);
            },
            onerror: (e) => {
              console.error("❌ Speech error:", e);
              isSpeaking = false;
              hasEnded = true;
              isAnimatingRef.current = false;
              setIsAnimating(false);
              if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
              }
              smoothTransition({}, 100);
            },
          },
        })
        .catch((e) => {
          console.error("❌ Error while speaking:", e);
          isSpeaking = false;
          hasEnded = true;
          isAnimatingRef.current = false;
          setIsAnimating(false);
        });
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
