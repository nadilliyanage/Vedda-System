import { HiClock, HiRefresh, HiTrash } from "react-icons/hi";
import { useState } from "react";

const TranslationHistory = ({
  history,
  onSelectHistoryItem,
  onRefresh,
  onDeleteHistoryItem,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500); // Brief delay for visual feedback
  };

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <HiClock className="w-5 h-5 mr-2" style={{ color: "#9a6f2a" }} />
          <h3 className="text-lg font-semibold" style={{ color: "#2d1f07" }}>
            Recent Translations
          </h3>
        </div>
        <button
          onClick={handleRefresh}
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
          title="Refresh history"
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

      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map((item, index) => (
            <div
              key={item.id ?? index}
              className="rounded-lg p-3 transition-all duration-200"
              style={{
                background: "rgba(255, 248, 230, 0.35)",
                border: "1px solid rgba(200, 165, 90, 0.28)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(200, 165, 90, 0.22)";
                e.currentTarget.style.borderColor = "rgba(200, 165, 90, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 248, 230, 0.35)";
                e.currentTarget.style.borderColor = "rgba(200, 165, 90, 0.28)";
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectHistoryItem(item)}
                >
                  <p
                    className="font-semibold text-sm mb-1"
                    style={{ color: "#2d1f07" }}
                  >
                    {item.input_text}
                  </p>
                  <p className="text-sm" style={{ color: "#5c4a1e" }}>
                    → {item.output_text}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistoryItem(item.id);
                  }}
                  title="Delete"
                  className="flex-shrink-0 p-1 rounded transition-colors duration-150"
                  style={{
                    color: "rgba(154,111,42,0.55)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#c0392b";
                    e.currentTarget.style.background = "rgba(192,57,43,0.10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(154,111,42,0.55)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "#8c7040" }}>
          No recent translations
        </p>
      )}
    </div>
  );
};

export default TranslationHistory;
