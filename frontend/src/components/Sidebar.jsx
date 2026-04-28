import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = {
  Admin: [
    { label: 'Overview', path: '/admin', icon: '📊' },
    { label: 'Phase Control', path: '/admin/phases', icon: '⚙️' },
    { label: 'Subjects', path: '/admin/subjects', icon: '📚' },
    { label: 'Teams', path: '/admin/teams', icon: '👥' },
    { label: 'Users', path: '/admin/users', icon: '👤' },
    { label: 'Profile', path: '/profile', icon: '🧑‍💻' },
  ],
  Mentor: [
    { label: 'Overview', path: '/mentor', icon: '📊' },
    { label: 'My Teams', path: '/mentor/teams', icon: '👥' },
    { label: 'Submissions', path: '/mentor/submissions', icon: '📝' },
    { label: 'Meetings', path: '/mentor/meetings', icon: '📅' },
    { label: 'Profile', path: '/profile', icon: '🧑‍💻' },
  ],
  Student: [
    { label: 'Overview', path: '/student', icon: '📊' },
    { label: 'Submit Work', path: '/student/submit', icon: '📤' },
    { label: 'Progress', path: '/student/progress', icon: '📈' },
    { label: 'Meetings', path: '/student/meetings', icon: '📅' },
    { label: 'Profile', path: '/profile', icon: '🧑‍💻' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d1117] border-r border-white/5 text-white flex flex-col shadow-2xl z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">PBL</span>
          <span className="text-slate-300 ml-1 font-light">System</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Project-Based Learning</p>
      </div>

      {/* Navigation with AnimatePresence for smooth context switching */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={user?.role || 'guest'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-1"
          >
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                    ${isActive
                      ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            {user?.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
