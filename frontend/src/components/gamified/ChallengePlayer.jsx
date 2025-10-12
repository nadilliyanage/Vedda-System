import { useEffect } from "react";
import useGamified from "../../hooks/useGamified";

export default function ChallengePlayer() {
  const { challenge, loading, error, getNextChallenge, submitChallenge, lastResult } = useGamified();

  useEffect(() => { getNextChallenge(); }, [getNextChallenge]);

  if (loading && !challenge) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!challenge) return <div className="p-4">No challenge available.</div>;

  const handleAnswer = async (optId) => {
    await submitChallenge({ challengeId: challenge.id, answer: optId });
  };

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow p-5">
      <h3 className="text-base font-semibold text-gray-900">{challenge.prompt}</h3>
      {challenge.options && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {challenge.options.map((opt) => (
            <button key={opt.id} onClick={() => handleAnswer(opt.id)} className="px-3 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left text-sm">
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {lastResult && (
        <div className="mt-4 text-sm">
          <div className={lastResult.correct ? "text-green-700" : "text-amber-700"}>
            {lastResult.correct ? "Correct!" : "Not quite"}
          </div>
          <div className="text-gray-700">+{lastResult.xpAwarded} XP · +{lastResult.coinsAwarded} coins</div>
          <button className="mt-3 px-3 py-2 rounded-lg bg-indigo-600 text-white" onClick={() => getNextChallenge()}>Next challenge</button>
        </div>
      )}
    </div>
  );
}
