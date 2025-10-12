import { Link } from "react-router-dom";
import { HiAcademicCap, HiTranslate, HiLightningBolt } from "react-icons/hi";

export default function Dashboard() {
  const modules = [
    {
      id: "translate",
      title: "Translator",
      desc: "Instant Vedda ⇄ English/Sinhala translation",
      to: "/translate",
      icon: <HiTranslate className="w-6 h-6" />,
      color: "bg-primary-500",
    },
    {
      id: "learn",
      title: "Learn",
      desc: "Adaptive lessons, challenges, and rewards",
      to: "/learn",
      icon: <HiAcademicCap className="w-6 h-6" />,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HiLightningBolt className="w-6 h-6 text-primary-500" /> Vedda Platform
          </h1>
        
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modules.map((m) => (
            <Link
              key={m.id}
              to={m.to}
              className="group rounded-xl bg-white shadow hover:shadow-lg transition p-5 border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center ${m.color}`}>
                {m.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-gray-800">
                {m.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
