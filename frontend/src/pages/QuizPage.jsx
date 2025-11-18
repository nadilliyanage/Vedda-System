import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBookOpen, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import axios from "axios";
import { SERVICE_URLS } from "../constants/languages";

const QuizPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);

  const fetchNext = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswer("");
    try {
      const res = await axios.get(`${SERVICE_URLS.TRANSLATOR}/api/learn/next-challenge`, { params: { type: 'fill_blank' } });
      setChallenge(res.data);
    } catch (e) {
      setError("Failed to load challenge");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!challenge) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${SERVICE_URLS.TRANSLATOR}/api/learn/submit`, {
        challengeId: challenge.id,
        answer: answer
      });
      setResult(res.data);
    } catch (e) {
      setError("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
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
            <FaBookOpen className="text-6xl text-green-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Word Learning Quiz</h1>
            <p className="text-lg text-gray-600 mb-8">Fill the blank by typing the correct English word.</p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4 text-red-700">{error}</div>
            )}

            {result && (
              <div className={`flex items-center gap-3 mb-6 p-4 rounded-lg ${result.correct ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {result.correct ? <FaCheckCircle className="text-2xl" /> : <FaTimesCircle className="text-2xl" />}
                <div>
                  <div className="font-semibold">{result.correct ? 'Correct!' : 'Not quite.'}</div>
                  <div className="text-sm">XP +{result.xpAwarded} • Coins +{result.coinsAwarded}</div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6">
              {loading && (
                <div className="text-gray-600">Loading...</div>
              )}
              {!loading && challenge && (
                <div>
                  <div className="text-xl font-medium text-gray-800 mb-4">{challenge.prompt}</div>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={!!result}
                    className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Type your answer"
                  />
                  <div className="mt-6 flex gap-3 justify-center">
                    {!result ? (
                      <button
                        onClick={submit}
                        disabled={loading || !answer.trim()}
                        className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Submit
                      </button>
                    ) : (
                      <button
                        onClick={fetchNext}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Next Challenge
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
