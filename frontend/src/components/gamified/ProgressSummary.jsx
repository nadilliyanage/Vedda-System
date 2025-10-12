import { HiLightBulb, HiMicrophone, HiBookOpen } from "react-icons/hi";

export default function ProgressSummary({ module }) {
  const items = [
    { id: "sr", icon: <HiLightBulb className="w-4 h-4" />, label: "Spaced Repetition", desc: "5 reviews due" },
    { id: "asr", icon: <HiMicrophone className="w-4 h-4" />, label: "Voice Practice", desc: "2 flashcards pending" },
    { id: "story", icon: <HiBookOpen className="w-4 h-4" />, label: "Stories", desc: "New story unlocked" },
  ];

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow p-5">
      <h3 className="text-base font-semibold text-gray-900">Your Progress</h3>
      {module && (
        <p className="text-sm text-gray-600 mt-1">Level {module.level} · {module.currentXP}/{module.nextLevelXP} XP</p>
      )}
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-800">
              <span className="w-6 h-6 rounded bg-gray-100 text-gray-700 flex items-center justify-center">
                {it.icon}
              </span>
              <span className="font-medium">{it.label}</span>
            </div>
            <span className="text-gray-600">{it.desc}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Review now</button>
        <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm hover:bg-gray-200">Practice voice</button>
      </div>
    </div>
  );
}
