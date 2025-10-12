export default function GamifiedOverview({ module }) {
  const percent = Math.min(100, Math.round((module.currentXP / module.nextLevelXP) * 100));
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{module.description}</h2>
          <p className="text-sm text-gray-600 mt-1">Level {module.level} · {module.currentXP}/{module.nextLevelXP} XP</p>
        </div>
        <a href="#" className="hidden sm:inline-block text-indigo-700 hover:underline text-sm">Module settings</a>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <p className="sr-only">{percent}% to next level</p>
      </div>
    </div>
  );
}
