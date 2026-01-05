import { useSearchParams } from "react-router-dom";
import Header from "./components/Header.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  const { isInitializing } = useAuth();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  return (
    <>
      <Header key={`header:${q}`} initialQuery={q} isInitializingSession={isInitializing} />
      <AppRoutes isInitializingSession={isInitializing} />
    </>
  );
}
