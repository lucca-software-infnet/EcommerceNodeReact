import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext.js";

export default function IndexRedirect() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div style={{ maxWidth: 720, margin: "40px auto" }}>
        <p>Carregando sessão...</p>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/me" : "/login"} replace />;
}

