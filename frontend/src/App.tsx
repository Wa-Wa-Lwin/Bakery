import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getSessionUser, logout } from './api/auth';
import type { AuthUser } from './types/Staff';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import CateringPage from './pages/CateringPage';

function homeFor(user: AuthUser): string {
  return user.role_name === 'Staff' ? '/catering' : '/admin';
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(getSessionUser);

  function handleLogin(loggedInUser: AuthUser) {
    setUser(loggedInUser);
  }

  function handleLogout() {
    logout();
    setUser(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login — redirect away if already signed in */}
        <Route
          path="/login"
          element={
            user ? <Navigate to={homeFor(user)} replace /> : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* Admin — Manager/Owner only */}
        <Route
          path="/admin"
          element={
            !user ? <Navigate to="/login" replace /> :
            user.role_name === 'Staff' ? <Navigate to="/catering" replace /> :
            <AdminPage user={user} onLogout={handleLogout} />
          }
        />

        {/* Catering — Staff only */}
        <Route
          path="/catering"
          element={
            !user ? <Navigate to="/login" replace /> :
            user.role_name !== 'Staff' ? <Navigate to={homeFor(user)} replace /> :
            <CateringPage user={user} onLogout={handleLogout} />
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={<Navigate to={user ? homeFor(user) : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
