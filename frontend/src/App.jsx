import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";

// Pages
import HomePage from "./pages/HomePage.jsx";
import TranslatorPage from "./pages/TranslatorPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import ArtifactPage from "./pages/ArtifactPage.jsx";
import VisualsPage from "./pages/VisualsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/translator" element={<TranslatorPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/artifacts" element={<ArtifactPage />} />
            <Route path="/3d-visuals" element={<VisualsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
