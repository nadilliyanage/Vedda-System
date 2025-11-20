import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBookOpen, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import axios from "axios";
import { SERVICE_URLS } from "../constants/languages";

const QuizPage = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("fill_blank");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState("");
  const [pairs, setPairs] = useState({});
  const [result, setResult] = useState(null);

  const fetchNext = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswer("");
    setPairs({});
    try {
      const res = await axios.get(`${SERVICE_URLS.TRANSLATOR}/api/learn/next-challenge`, { params: { type: selectedType } });
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
      let payload = { challengeId: challenge.id };
      if (challenge.type === "fill_blank") {
        payload.answer = answer;
      } else if (challenge.type === "multiple_choice") {
        payload.selectedOption = answer;
      } else if (challenge.type === "match_pairs") {
        payload.answer = pairs;
      }
      const res = await axios.post(`${SERVICE_URLS.TRANSLATOR}/api/learn/submit`, payload);
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
  }, [selectedType]);

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
            <p className="text-lg text-gray-600 mb-4">Practice Vedda vocabulary with different challenge types.</p>
            
            {/* Challenge Type Selector */}
            <div className="flex gap-3 justify-center mb-8">
              <button
                onClick={() => setSelectedType("fill_blank")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === "fill_blank"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Fill in the Blank
              </button>
              <button
                onClick={() => setSelectedType("multiple_choice")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === "multiple_choice"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Multiple Choice
              </button>
              <button
                onClick={() => setSelectedType("match_pairs")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === "match_pairs"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Match Pairs
              </button>
            </div>

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
                  
                  {/* Fill in the Blank */}
                  {challenge.type === "fill_blank" && (
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={!!result}
                      className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="Type your answer"
                    />
                  )}
                  
                  {/* Multiple Choice */}
                  {challenge.type === "multiple_choice" && challenge.options && (
                    <div className="space-y-3">
                      {challenge.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setAnswer(option.id)}
                          disabled={!!result}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                            answer === option.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-300 hover:border-green-300"
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          <span className="font-semibold mr-2">{option.id}.</span>
                          {option.text}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Match Pairs */}
                  {challenge.type === "match_pairs" && challenge.pairs && challenge.rightOptions && (
                    <div className="space-y-4">
                      {challenge.pairs.map((pair, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-gray-800 font-medium">
                            {pair.left}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {challenge.rightOptions.map((option, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => setPairs({ ...pairs, [pair.left]: option })}
                                disabled={!!result}
                                className={`px-4 py-2 rounded-lg border-2 transition-colors text-left ${
                                  pairs[pair.left] === option
                                    ? "border-green-500 bg-green-50 font-medium"
                                    : "border-gray-300 hover:border-green-300 bg-white"
                                } disabled:opacity-60 disabled:cursor-not-allowed`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6 flex gap-3 justify-center">
                    {!result ? (
                      <button
                        onClick={submit}
                        disabled={loading || (
                          (challenge.type === "fill_blank" && !answer.trim()) ||
                          (challenge.type === "multiple_choice" && !answer) ||
                          (challenge.type === "match_pairs" && Object.keys(pairs).length === 0)
                        )}
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
