import { BrowserRouter as Router } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ToasterProvider from "./components/ui/ToasterProvider";
import LoadingScreen from "./components/ui/LoadingScreen";
import AppRouter from "./Router";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Show loading screen for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <AuthProvider>
        <ToasterProvider />
        <AppRouter />
      </AuthProvider>
    </Router>
  );
}

export default App;
