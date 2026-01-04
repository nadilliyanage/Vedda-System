import { useNavigate } from "react-router-dom";
import { FaLanguage, FaBookOpen, FaLandmark, FaCube } from "react-icons/fa";

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      title: "Vedda Translator",
      description:
        "Translate between Vedda, Sinhala, English and other languages",
      icon: FaLanguage,
      path: "/translator",
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      bgImage: "/assets/background-images/vedda-translator-bg.png",
    },
    {
      id: 2,
      title: "Vedda Vocabulary Learning",
      description:
        "Learn, practice, and test your Vedda vocabulary skills",
      icon: FaBookOpen,
      path: "/learning",
      color: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      bgImage: "/assets/background-images/vocabulary-learning-bg.png",
    },
    {
      id: 3,
      title: "Artifact Learning System",
      description:
        "Explore and learn about Vedda cultural artifacts and history",
      icon: FaLandmark,
      path: "/artifacts",
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      bgImage: "/assets/background-images/artifact-learning-bg.png",
    },
    {
      id: 4,
      title: "3D Visuals",
      description:
        "Experience Vedda words through interactive 3D visualizations",
      icon: FaCube,
      path: "/3d-visuals",
      color: "from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
      bgImage: "/assets/background-images/3d-visuals-bg.png",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
            Vedda Culture Preservation System
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Preserving and promoting the indigenous Vedda culture through
            modern technology
          </p>
          <div className="mt-6 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden h-full">
                  <div
                    className={`relative bg-gradient-to-r ${feature.color} transition-all duration-300 p-8 text-white h-52 flex flex-col justify-end overflow-hidden`}
                  >
                    {/* Background Image with Left-to-Right Gradient Mask */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(${feature.bgImage})`,
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 25%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,1) 75%, rgba(0,0,0,1) 100%)',
                        maskImage: 'linear-gradient(to right, transparent 0%, transparent 25%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,1) 75%, rgba(0,0,0,1) 100%)'
                      }}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <Icon className="text-5xl mb-4" />
                      <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-lg">
                      {feature.description}
                    </p>
                    <div className="mt-4 flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                      <span>Get Started</span>
                      <svg
                        className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* About Section */}
        <div className="mt-20 max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            About the Vedda Culture
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed text-center">
            The Vedda culture is the indigenous culture of the Vedda people of
            Sri Lanka. This platform is dedicated to preserving and promoting
            this unique culture through interactive learning tools, cultural
            resources, and modern technology. Explore our features to immerse
            yourself in the rich heritage of the Vedda community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
