import { useState, useEffect } from "react";
import { HiRefresh } from "react-icons/hi";
import { getRandomWords } from "../../services/dictionaryService";

// Singlish romanization mapping (Sinhala/Vedda script → Latin)
const SINHALA_TO_SINGLISH = {
  අ: "a",
  ආ: "aa",
  ඇ: "ae",
  ඈ: "aae",
  ඉ: "i",
  ඊ: "ii",
  උ: "u",
  ඌ: "uu",
  ඍ: "ru",
  ඎ: "ruu",
  ඏ: "lu",
  ඐ: "luu",
  එ: "e",
  ඒ: "ee",
  ඓ: "ai",
  ඔ: "o",
  ඕ: "oo",
  ඖ: "au",
  ක: "ka",
  ඛ: "kha",
  ග: "ga",
  ඝ: "gha",
  ඞ: "nga",
  ච: "cha",
  ඡ: "chha",
  ජ: "ja",
  ඣ: "jha",
  ඤ: "gna",
  ට: "ta",
  ඨ: "tha",
  ඩ: "da",
  ඪ: "dha",
  ණ: "na",
  ත: "tha",
  ථ: "thha",
  ද: "dha",
  ධ: "dhha",
  න: "na",
  ප: "pa",
  ඵ: "pha",
  බ: "ba",
  භ: "bha",
  ම: "ma",
  ය: "ya",
  ර: "ra",
  ල: "la",
  ව: "wa",
  ශ: "sha",
  ෂ: "sha",
  ස: "sa",
  හ: "ha",
  ළ: "la",
  ෆ: "fa",
  "ං": "ng",
  "ඃ": "h",
  "්": "",
  "ා": "aa",
  "ැ": "ae",
  "ෑ": "aae",
  "ි": "i",
  "ී": "ii",
  "ු": "u",
  "ූ": "uu",
  "ෘ": "ru",
  "ෲ": "ruu",
  "ෟ": "lu",
  "ෳ": "luu",
  "ෙ": "e",
  "ේ": "ee",
  "ෛ": "ai",
  "ො": "o",
  "ෝ": "oo",
  "ෞ": "au",
};

const toSinglish = (text) => {
  if (!text) return "";
  let result = "";
  for (const char of text) {
    result += SINHALA_TO_SINGLISH[char] ?? char;
  }
  return result.trim();
};

const ExamplePhrases = ({ onSelectExample }) => {
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchExamples = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const words = await getRandomWords(5);
      setExamples(words);
    } catch (error) {
      console.error("Failed to fetch random words:", error);
      setExamples([]);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchExamples();
  }, []);

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "#2d1f07" }}>
          Try These Examples
        </h3>
        <button
          onClick={fetchExamples}
          disabled={isRefreshing}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
          style={{
            color: isRefreshing ? "rgba(140,112,64,0.45)" : "#5c4a1e",
            background: isRefreshing ? "rgba(200,165,90,0.08)" : "transparent",
            border: "1px solid transparent",
            cursor: isRefreshing ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!isRefreshing)
              e.currentTarget.style.background = "rgba(200,165,90,0.16)";
          }}
          onMouseLeave={(e) => {
            if (!isRefreshing) e.currentTarget.style.background = "transparent";
          }}
          title="Refresh examples"
        >
          <HiRefresh
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <hr
        className="mb-4"
        style={{ borderColor: "rgba(200, 165, 90, 0.25)" }}
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg p-3 animate-pulse"
              style={{
                background: "rgba(200, 165, 90, 0.12)",
                border: "1px solid rgba(200, 165, 90, 0.20)",
              }}
            >
              <div
                className="h-4 rounded w-3/4 mb-2"
                style={{ background: "rgba(200,165,90,0.22)" }}
              />
              <div
                className="h-3 rounded w-1/2"
                style={{ background: "rgba(200,165,90,0.14)" }}
              />
            </div>
          ))}
        </div>
      ) : examples.length > 0 ? (
        <div className="space-y-2">
          {examples.map((word, index) => {
            const singlish = toSinglish(word.vedda_word);
            return (
              <div
                key={word.id || index}
                className="rounded-lg p-3 cursor-pointer transition-all duration-200"
                style={{
                  background: "rgba(255, 248, 230, 0.35)",
                  border: "1px solid rgba(200, 165, 90, 0.28)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(200, 165, 90, 0.22)";
                  e.currentTarget.style.borderColor =
                    "rgba(200, 165, 90, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 248, 230, 0.35)";
                  e.currentTarget.style.borderColor =
                    "rgba(200, 165, 90, 0.28)";
                }}
                onClick={() =>
                  onSelectExample({
                    vedda: word.vedda_word,
                    english: word.english_word,
                  })
                }
              >
                <p
                  className="font-semibold text-sm mb-1"
                  style={{ color: "#2d1f07" }}
                >
                  {word.vedda_word}
                </p>
                {singlish && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#9a6f2a" }}
                  >
                    {singlish}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-center py-4" style={{ color: "#8c7040" }}>
          No words available
        </p>
      )}
    </div>
  );
};

export default ExamplePhrases;
