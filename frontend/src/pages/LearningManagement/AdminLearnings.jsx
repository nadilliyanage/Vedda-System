import { useState } from "react";
import { FaBook, FaDumbbell, FaTrophy, FaArrowLeft } from "react-icons/fa";
import LoadingScreen from "../../components/ui/LoadingScreen";
import AdminChallenges from "./AdminChallenges";
import AdminLessons from "./AdminLessons";
import AdminExercises from "./AdminExercises";

const AdminLearnings = () => {
  const [activeView, setActiveView] = useState("main"); // 'main', 'lessons', 'exercises', 'challenges'

  const navigationCards = [
    {
      id: "lessons",
      title: "Manage Lessons",
      icon: FaBook,
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
      description: "Create and organize learning lessons",
    },
    {
      id: "exercises",
      title: "Manage Exercises",
      icon: FaDumbbell,
      color: "bg-green-600",
      hoverColor: "hover:bg-green-700",
      description: "Design practice exercises for learners",
    },
    {
      id: "challenges",
      title: "Manage Challenges",
      icon: FaTrophy,
      color: "bg-orange-600",
      hoverColor: "hover:bg-orange-700",
      description: "Configure quiz challenges and assessments",
    },
  ];

  const handleCardClick = (viewId) => {
    setActiveView(viewId);
  };

  const handleBackToMain = () => {
    setActiveView("main");
  };

  // Main view with three navigation cards
  if (activeView === "main") {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
            Learning Management
          </h1>
          <p className="mt-2" style={{ color: "rgba(212,180,131,0.70)" }}>
            Manage lessons, exercises, and challenges for the Vedda System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`${card.color} ${card.hoverColor} text-white rounded-xl shadow-lg p-8 transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[280px]`}
              >
                <IconComponent className="text-6xl mb-4" />
                <h2 className="text-2xl font-bold text-center mb-2">
                  {card.title}
                </h2>
                <p className="text-white/90 text-center text-sm">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Sub-views
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={handleBackToMain}
          className="flex items-center gap-2 transition-colors mb-4"
          style={{ color: "rgba(212,180,131,0.70)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#d4b483";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(212,180,131,0.70)";
          }}
        >
          <FaArrowLeft /> Back to Learning Management
        </button>

        <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
          {activeView === "lessons" && "Manage Lessons"}
          {activeView === "exercises" && "Manage Exercises"}
          {activeView === "challenges" && "Manage Challenges"}
        </h1>
      </div>

      {activeView === "lessons" && <AdminLessons />}

      {activeView === "exercises" && <AdminExercises />}

      {activeView === "challenges" && <AdminChallenges />}
    </div>
  );
};

export default AdminLearnings;
