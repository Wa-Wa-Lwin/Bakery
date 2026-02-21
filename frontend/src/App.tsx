import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getSessionUser, logout } from './api/auth';
import type { AuthUser } from './types/Staff';
import { appendAudit } from './data/audit';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import CateringPage from './pages/CateringPage';
import PaymentPage from './pages/PaymentPage';

function homeFor(user: AuthUser): string {
  return user.role_name === 'Staff' ? '/catering' : '/home';
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(getSessionUser);

  function handleLogin(loggedInUser: AuthUser) {
    setUser(loggedInUser);
    appendAudit(loggedInUser, 'SESSION_START', `${loggedInUser.full_name} signed in as ${loggedInUser.role_name}`);
  }

  function handleLogout() {
    if (user) {
      appendAudit(user, 'SESSION_END', `${user.full_name} signed out`);
    }
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

        {/* Home — Manager/Owner only (Staff go directly to /catering) */}
        <Route
          path="/home"
          element={
            !user ? <Navigate to="/login" replace /> :
            user.role_name === 'Staff' ? <Navigate to="/catering" replace /> :
            <HomePage user={user} onLogout={handleLogout} />
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

        {/* Catering / Order entry — all logged-in roles */}
        <Route
          path="/catering"
          element={
            !user ? <Navigate to="/login" replace /> :
            <CateringPage user={user} onLogout={handleLogout} />
          }
        />

        {/* Payment — any logged-in role */}
        <Route
          path="/payment"
          element={
            !user ? <Navigate to="/login" replace /> :
            <PaymentPage user={user} onLogout={handleLogout} />
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
