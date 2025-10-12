import { HiPlay } from "react-icons/hi";

export default function ChallengePreview({ challenge }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Next Challenge</h3>
        <span className="text-xs text-gray-500 uppercase">{challenge.type.replace('_',' ')}</span>
      </div>
      <p className="mt-3 text-gray-800">{challenge.prompt}</p>
      {challenge.options && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {challenge.options.map((opt) => (
            <button key={opt.id} className="px-3 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left text-sm">
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
          <HiPlay className="w-5 h-5" /> Start
        </button>
        <span className="text-sm text-gray-600">+{challenge.xp} XP · +{challenge.coins} coins</span>
      </div>
    </div>
  );
}
