import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ToasterProvider from "./components/ui/ToasterProvider";
import AppRouter from "./Router";

function App() {
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
