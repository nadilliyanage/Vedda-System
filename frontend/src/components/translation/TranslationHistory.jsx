import { HiClock } from "react-icons/hi";

const TranslationHistory = ({ history, onSelectHistoryItem }) => {
  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <HiClock className="w-5 h-5 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Translations
        </h3>
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
