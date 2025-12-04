import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/admin/AdminLayout";

// Pages
import HomePage from "./pages/HomePage.jsx";
import TranslatorPage from "./pages/TranslatorPage.jsx";
import QuizPage from "./pages/LearningManagement/QuizPage.jsx";
import VeddaLearning from "./pages/LearningManagement/VeddaLearning.jsx";
import ArtifactPage from "./pages/ArtifactPage.jsx";
import VisualsPage from "./pages/VisualsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminWords from "./pages/AdminWords.jsx";
import AdminLearnings from "./pages/LearningManagement/AdminLearnings.jsx";
import AdminArtifacts from "./pages/AdminArtifacts.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";

const AppRouter = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Main routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/translator" element={<TranslatorPage />} />
        <Route path="/learning" element={<VeddaLearning />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/artifacts" element={<ArtifactPage />} />
        <Route path="/3d-visuals" element={<VisualsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin routes with sidebar */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/words" element={<AdminWords />} />
        <Route path="/admin/lernings" element={<AdminLearnings />} />
        <Route path="/admin/artifacts" element={<AdminArtifacts />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
