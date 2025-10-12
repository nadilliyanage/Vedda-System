import { EXAMPLE_PHRASES } from "../../constants/languages";

const ExamplePhrases = ({ onSelectExample }) => {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Try These Examples
      </h3>

      <hr className="border-gray-200 mb-4" />

      <div className="space-y-2">
        {EXAMPLE_PHRASES.map((example, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={() => onSelectExample(example)}
          >
            <p className="font-medium text-gray-900 text-sm mb-1">
              {example.vedda}
            </p>
            <p className="text-sm text-gray-600">{example.english}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamplePhrases;
