import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBookOpen } from "react-icons/fa";

const QuizPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
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
            <FaBookOpen className="text-6xl text-green-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Word Learning Quiz
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Test your knowledge of Vedda vocabulary with interactive quizzes
            </p>
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
              <p className="text-gray-700 text-lg">
                🚧 This feature is currently under development. Check back soon for
                exciting quiz challenges to enhance your Vedda language skills!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
