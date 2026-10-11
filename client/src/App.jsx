import React, { useCallback, useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import MiningBlastTransition from "./components/MiningBlastTransition";

export default function App() {
  // Store authenticated user in state with localStorage persistence
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("mineguard_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [transitionUser, setTransitionUser] = useState(null);

  const handleLoginSuccess = (user) => {
    setTransitionUser(user);
  };

  const handleTransitionComplete = useCallback(() => {
    if (!transitionUser) return;
    setCurrentUser(transitionUser);
    try {
      localStorage.setItem("mineguard_user", JSON.stringify(transitionUser));
    } catch (e) {}
    setTransitionUser(null);
  }, [transitionUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("mineguard_user");
    } catch (e) {}
  };

  return (
    <div className="mineguard-app-root">
      {currentUser ? (
        <Dashboard currentUser={currentUser} onLogout={handleLogout} />
      ) : transitionUser ? (
        <MiningBlastTransition user={transitionUser} onComplete={handleTransitionComplete} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
