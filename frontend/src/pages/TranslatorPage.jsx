import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

// Components
import TranslationCard from "../components/translation/TranslationCard.jsx";
import TranslationHistory from "../components/translation/TranslationHistory.jsx";
import ExamplePhrases from "../components/ui/ExamplePhrases.jsx";

// Hooks
import { useTranslationHistory } from "../hooks/useTranslationHistory";

const TranslatorPage = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("vedda");
  const [targetLanguage, setTargetLanguage] = useState("english");

  const { translationHistory, fetchHistory } = useTranslationHistory();

  const handleHistoryItemSelect = (item) => {
    setInputText(item.input_text);
    setSourceLanguage(item.source_language);
    setTargetLanguage(item.target_language);
  };

  const handleExampleSelect = (example) => {
    setInputText(example.vedda);
    setSourceLanguage("vedda");
    setTargetLanguage("english");
  };

  return (
    <div
      className="min-h-screen mt-[60px]"
      style={{
        backgroundImage: `url('/assets/background-images/background-1.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ── Glassmorphic nav bar ── */}
      <div
        style={{
          background: "rgba(28,20,8,0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(200,170,100,0.18)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.20)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                color: "rgba(255,248,230,0.90)",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(200,165,90,0.25)",
                borderRadius: "9px", padding: "0.4rem 0.9rem",
                fontFamily: "system-ui, sans-serif", fontWeight: "600",
                fontSize: "0.88rem", cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(200,165,90,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              <FaArrowLeft style={{ fontSize: "0.8rem" }} />
              Back to Home
            </button>
            <div style={{
              color: "#d4b483", fontFamily: "system-ui, sans-serif",
              fontWeight: "600", fontSize: "0.9rem",
            }}>
              Vedda Language Translator
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0) 100%)",
          paddingTop: "1.5rem",
          paddingBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        <span style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.60)",
          border: "1px solid rgba(100,80,40,0.22)",
          borderRadius: "999px",
          padding: "0.28rem 1rem",
          fontSize: "0.73rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#5c4a1e",
          marginBottom: "0.6rem",
          fontFamily: "system-ui, sans-serif",
        }}>
          🗣️ Language Translation
        </span>
        <h1 style={{
          fontSize: "45px",
          fontWeight: "800",
          color: "#1c1409",
          lineHeight: 1.2,
          margin: "0 auto 0.5rem",
          maxWidth: "720px",
          fontFamily: "'Georgia', serif",
          letterSpacing: "-0.3px",
          textShadow: "0 1px 0 rgba(255,255,255,0.8)",
          padding: "0 1rem",
        }}>
          Vedda{" "}
          <span style={{ color: "#9a6f2a", textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)" }}>
            Language
          </span>{" "}
          Translator
        </h1>
        <p style={{
          fontSize: "clamp(0.9rem,1.8vw,1.08rem)",
          color: "#3d2e0f",
          maxWidth: "540px",
          margin: "0 auto 0.5rem",
          lineHeight: 1.75,
          fontFamily: "'Georgia', serif",
          fontStyle: "italic",
          padding: "0 1rem",
        }}>
          Translate between Vedda, Sinhala, and English to preserve the indigenous language.
        </p>
        <div style={{
          width: "52px", height: "3px",
          background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
          margin: "1rem auto 0",
          borderRadius: "99px",
        }} />
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Main Translation Card */}
        <TranslationCard
          inputText={inputText}
          setInputText={setInputText}
          sourceLanguage={sourceLanguage}
          setSourceLanguage={setSourceLanguage}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          onTranslationComplete={fetchHistory}
        />

        {/* Recent Translations & Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 items-stretch">
          {/* Recent Translations */}
          <div className="h-full">
            <TranslationHistory
              history={translationHistory}
              onSelectHistoryItem={handleHistoryItemSelect}
              onRefresh={fetchHistory}
            />
          </div>

          {/* Example Phrases */}
          <div className="h-full">
            <ExamplePhrases onSelectExample={handleExampleSelect} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatorPage;
