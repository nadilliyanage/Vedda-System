import { useState } from "react";
import { Link } from "react-router-dom";
import { HiPlay, HiStar, HiChartBar, HiLightningBolt } from "react-icons/hi";
import GamifiedOverview from "../../components/gamified/GamifiedOverview.jsx";
import ChallengePreview from "../../components/gamified/ChallengePreview.jsx";
import ProgressSummary from "../../components/gamified/ProgressSummary.jsx";
import ChallengePlayer from "../../components/gamified/ChallengePlayer.jsx";

export default function GamifiedModule() {
  const [module] = useState({
    id: "vedda_vocab",
    title: "Learn Vedda",
    description: "Adaptive spaced repetition • Voice flashcards • Stories",
    currentXP: 320,
    level: 3,
    nextLevelXP: 500,
  });

  const nextChallenge = {
    id: "c42",
    type: "multiple_choice",
    prompt: "Translate 'kola'",
    options: [
      { id: "o1", label: "leaf" },
      { id: "o2", label: "stone" },
      { id: "o3", label: "river" },
      { id: "o4", label: "bird" },
    ],
    xp: 15,
    coins: 3,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center gap-2">
          <HiLightningBolt className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
        </header>

        <GamifiedOverview module={module} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            <ChallengePreview challenge={nextChallenge} />
            
            <ChallengePlayer />
          </div>
          <div className="space-y-6">
            <ProgressSummary module={module} />
            <div className="rounded-xl bg-white border border-gray-100 shadow p-5">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <HiStar className="w-5 h-5 text-amber-500" /> Leaderboard
              </h3>
              <p className="text-sm text-gray-600 mt-1">Compete with friends.</p>
              <Link to="#" className="inline-flex items-center gap-2 mt-3 text-indigo-700 hover:underline">
                <HiChartBar className="w-5 h-5" /> View leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
