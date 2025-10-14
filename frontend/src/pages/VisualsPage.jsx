import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCube } from "react-icons/fa";

const VisualsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span className="font-medium">Back to Home</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <FaCube className="text-6xl text-orange-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              3D Visuals for Vedda Words
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Experience Vedda vocabulary through immersive 3D visualizations
            </p>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg">
              <p className="text-gray-700 text-lg">
                🚧 This feature is currently under development. Get ready to
                experience Vedda words in a whole new dimension with interactive 3D
                models and visualizations!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualsPage;
