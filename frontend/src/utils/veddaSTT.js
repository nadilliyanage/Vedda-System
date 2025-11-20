// Vedda Speech-to-Text utility with Sinhala bridge processing

/**
 * Vedda STT class that uses Sinhala STT as base and processes through Vedda dictionary
 */
export class VeddaSTT {
  constructor() {
    this.apiBaseUrl = "http://localhost:5007"; // Speech service URL
    this.isProcessing = false;
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
  }

  /**
   * Process Sinhala STT result through Vedda processor
   */
  async processSinhalaToVedda(sinhalaText, confidence = 0.8) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/vedda-stt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sinhala_text: sinhalaText,
          confidence: confidence,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Vedda STT processing error:", error);
      throw error;
    }
  }

  /**
   * Initialize Vedda STT with browser speech recognition
   */
  initialize() {
    // Import browser STT
    import("./browserSTT.js").then((module) => {
      this.browserSTT = new module.BrowserSpeechRecognition();

      // Configure for Sinhala (as base for Vedda)
      this.browserSTT.initialize("sinhala");

      // Set up event handlers
      this.browserSTT.onStart = () => {
        console.log("Vedda STT started (using Sinhala base)");
        if (this.onStart) {
          this.onStart();
        }
      };

      this.browserSTT.onResult = async (sinhalaResult) => {
        if (sinhalaResult.success && sinhalaResult.text) {
          console.log(`Sinhala STT result: "${sinhalaResult.text}"`);

          // Process through Vedda processor
          try {
            this.isProcessing = true;
            const veddaResult = await this.processSinhalaToVedda(
              sinhalaResult.text,
              sinhalaResult.confidence
            );

            if (veddaResult.success && this.onResult) {
              this.onResult({
                success: true,
                text: veddaResult.vedda_text,
                original_sinhala: veddaResult.original_sinhala,
                confidence: veddaResult.confidence,
                language: "vedda",
                method: "vedda_stt_bridge",
                matched_words: veddaResult.matched_words || 0,
                total_words: veddaResult.total_words || 0,
                word_details: veddaResult.word_details || [],
              });
            } else {
              // Fallback to original Sinhala text
              if (this.onResult) {
                this.onResult({
                  success: true,
                  text: sinhalaResult.text,
                  original_sinhala: sinhalaResult.text,
                  confidence: sinhalaResult.confidence * 0.7, // Lower confidence
                  language: "vedda",
                  method: "sinhala_fallback",
                  note: "Vedda processing failed, using Sinhala result",
                });
              }
            }
          } catch (error) {
            console.error("Vedda processing failed:", error);
            // Fallback to original Sinhala result
            if (this.onResult) {
              this.onResult({
                success: true,
                text: sinhalaResult.text,
                original_sinhala: sinhalaResult.text,
                confidence: sinhalaResult.confidence * 0.6, // Lower confidence
                language: "vedda",
                method: "sinhala_fallback",
                error: "Vedda processing failed",
              });
            }
          } finally {
            this.isProcessing = false;
          }
        } else {
          // Pass through the error
          if (this.onResult) {
            this.onResult(sinhalaResult);
          }
        }
      };

      this.browserSTT.onError = (error, shouldRetry, errorType) => {
        console.error("Vedda STT (Sinhala base) error:", error);
        if (this.onError) {
          this.onError(error, shouldRetry, errorType);
        }
      };

      this.browserSTT.onEnd = () => {
        console.log("Vedda STT ended");
        if (this.onEnd) {
          this.onEnd();
        }
      };
    });
  }

  /**
   * Check if Vedda STT is supported
   */
  static isSupported() {
    // Check if browser supports speech recognition (for Sinhala base)
    return (
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) &&
      navigator.onLine // Requires internet for processing
    );
  }

  /**
   * Start Vedda STT
   */
  start() {
    if (!this.browserSTT) {
      throw new Error("Vedda STT not initialized. Call initialize() first.");
    }

    if (this.isProcessing) {
      console.warn("Vedda STT processing already in progress");
      return;
    }

    try {
      this.browserSTT.start();
    } catch (error) {
      console.error("Failed to start Vedda STT:", error);
      throw error;
    }
  }

  /**
   * Stop Vedda STT
   */
  stop() {
    if (this.browserSTT) {
      this.browserSTT.stop();
    }
  }

  /**
   * Get Vedda dictionary statistics
   */
  async getDictionaryStats() {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/vedda-dictionary/stats`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to get dictionary stats:", error);
      throw error;
    }
  }

  /**
   * Test the Vedda STT processor with sample text
   */
  async testProcessor(sinhalaText = "ළමයි ගෙදර ඉන්නවා") {
    try {
      console.log(`Testing Vedda STT with: "${sinhalaText}"`);
      const result = await this.processSinhalaToVedda(sinhalaText, 0.9);
      console.log("Test result:", result);
      return result;
    } catch (error) {
      console.error("Test failed:", error);
      throw error;
    }
  }
}

/**
 * Convenience function to create and initialize Vedda STT
 */
export async function createVeddaSTT() {
  const veddaSTT = new VeddaSTT();
  await veddaSTT.initialize();
  return veddaSTT;
}

// Example usage
export const veddaSTTExample = {
  async demo() {
    try {
      const veddaSTT = await createVeddaSTT();

      // Test the processor
      await veddaSTT.testProcessor("ළමයි ගෙදර ඉන්නවා");

      // Get dictionary stats
      const stats = await veddaSTT.getDictionaryStats();
      console.log("Dictionary stats:", stats);
    } catch (error) {
      console.error("Demo failed:", error);
    }
  },
};
