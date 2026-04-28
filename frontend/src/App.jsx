import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import MentorDashboard from './pages/mentor/MentorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import Profile from './pages/Profile';
import DynamicBackground from './components/DynamicBackground';
// ──────────────────────────────────────────────
// Protected Route — Redirects to /login if unauthenticated
// Checks role against allowedRoles for RBAC
// ──────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

// ──────────────────────────────────────────────
// Auto-redirect to role-appropriate dashboard
// ──────────────────────────────────────────────
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'Admin') return <Navigate to="/admin" replace />;
  if (user.role === 'Mentor') return <Navigate to="/mentor" replace />;
  if (user.role === 'Student') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
};

// ──────────────────────────────────────────────
// Guest Route — Redirects to dashboard if already logged in
// ──────────────────────────────────────────────
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <DynamicBackground>{children}</DynamicBackground>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Guest routes (login/signup) — redirect if already authenticated */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

        {/* Protected role-based dashboards */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/mentor/*" element={
          <ProtectedRoute allowedRoles={['Mentor']}>
            <MentorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['Student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Profile - allowed for all authenticated users */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Root — redirect based on role */}
        <Route path="/" element={<DashboardRedirect />} />

        {/* Catch-all — redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
