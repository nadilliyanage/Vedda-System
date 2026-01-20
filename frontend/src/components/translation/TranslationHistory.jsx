import { HiClock, HiRefresh } from "react-icons/hi";
import { useState } from "react";

const TranslationHistory = ({ history, onSelectHistoryItem, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500); // Brief delay for visual feedback
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <HiClock className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Translations
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
            isRefreshing
              ? "text-gray-400 bg-gray-50 cursor-not-allowed"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
          title="Refresh history"
        >
          <HiRefresh className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <hr className="border-gray-200 mb-4" />

      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={() => onSelectHistoryItem(item)}
            >
              <p className="font-medium text-gray-900 text-sm mb-1">
                {item.input_text}
              </p>
              <p className="text-sm text-gray-600">→ {item.output_text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No recent translations</p>
      )}
    </div>
  );
};

export default TranslationHistory;
