import { Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import RoundBoard from './pages/RoundBoard';
import Dashboard from './pages/Dashboard';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
};

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-xl font-semibold text-orange">GrubSync</Link>
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <Link to="/dashboard" className="rounded-full bg-slate-800 px-4 py-2 text-slate-100 hover:bg-slate-700">Dashboard</Link>
            {user ? (
              <button onClick={logout} className="rounded-full bg-orange px-4 py-2 text-white hover:bg-orange/90">
                Logout
              </button>
            ) : (
              <Link to="/auth" className="rounded-full bg-orange px-4 py-2 text-white hover:bg-orange/90">Login</Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/round/:roomCode" element={<ProtectedRoute><RoundBoard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Layout />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
