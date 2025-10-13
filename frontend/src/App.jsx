import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage.jsx";
import TranslatorPage from "./pages/TranslatorPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import ArtifactPage from "./pages/ArtifactPage.jsx";
import VisualsPage from "./pages/VisualsPage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/translator" element={<TranslatorPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/artifacts" element={<ArtifactPage />} />
        <Route path="/3d-visuals" element={<VisualsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
