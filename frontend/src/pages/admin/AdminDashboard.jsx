import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import MagneticButton from '../../components/MagneticButton';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { getActivePhase, setActivePhase, getTeams, getUsers, createTeam, getSubjects, createSubject, deleteTeam } from '../../utils/api';

function AdminOverview() {
  const { user } = useAuth();
  const [phase, setPhase] = useState(1);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [phaseRes, teamsRes, usersRes] = await Promise.all([
          getActivePhase(), getTeams(), getUsers()
        ]);
        setPhase(phaseRes.data.activePhase);
        setTeams(teamsRes.data);
        setUsers(usersRes.data);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const avgProgress = teams.length ? Math.round(teams.reduce((s, t) => s + (t.progress || 0), 0) / teams.length) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-200">Welcome back, {user?.name} 👋</h1>
        <p className="text-slate-500 mt-1">Here's an overview of the PBL system.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon="🎯" label="Active Phase" value={`Phase ${phase}`} color="purple" />
        <StatCard icon="👥" label="Total Teams" value={teams.length} color="blue" />
        <StatCard icon="👤" label="Total Users" value={users.length} color="cyan" />
        <StatCard icon="📈" label="Avg Progress" value={`${avgProgress}%`} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Team Progress</h3>
          {teams.length === 0 ? (
            <p className="text-slate-400 text-sm">No teams yet.</p>
          ) : (
            <div className="space-y-4">
              {teams.map(t => (
                <div key={t._id}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-mono text-xs font-bold">{t.teamNo || 'NO_ID'}</span>
                      <span className="font-medium text-slate-300">{t.name}</span>
                    </div>
                    <span className="text-slate-500">{t.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.min(t.progress || 0, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">User Breakdown</h3>
          {['Admin', 'Mentor', 'Student'].map(role => {
            const count = users.filter(u => u.role === role).length;
            return (
              <div key={role} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${role === 'Admin' ? 'bg-purple-500' : role === 'Mentor' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  <span className="text-sm font-medium text-slate-300">{role}s</span>
                </div>
                <span className="text-sm font-bold text-slate-200">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhaseControl() {
  const [phase, setPhaseState] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getActivePhase().then(r => setPhaseState(r.data.activePhase)).catch(console.error);
  }, []);

  const handleChange = async (newPhase) => {
    setLoading(true);
    setMsg('');
    try {
      await setActivePhase(newPhase);
      setPhaseState(newPhase);
      setMsg(`Phase updated to Phase ${newPhase}`);
    } catch (err) {
      setMsg('Failed to update phase');
    }
    setLoading(false);
  };

  const phaseInfo = {
    1: { name: 'Synopsis', desc: 'Teams submit their project proposals and initial plans.', color: 'from-blue-500 to-blue-600' },
    2: { name: 'Development', desc: 'Teams work on their projects and submit progress.', color: 'from-cyan-500 to-teal-500' },
    3: { name: 'Final Review', desc: 'Final project submission and comprehensive evaluation.', color: 'from-emerald-500 to-green-600' },
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-200 mb-2">Phase Control</h1>
      <p className="text-slate-500 mb-8">Manage the global active phase. Only one phase can be active at a time.</p>

      {msg && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(p => (
          <div key={p} className={`relative rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer
            ${phase === p ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' : 'border-white/20 glass-panel hover:border-slate-300'}`}
            onClick={() => handleChange(p)}>
            {phase === p && (
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${phaseInfo[p].color} flex items-center justify-center text-white text-lg font-bold mb-4 shadow-lg`}>
              {p}
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Phase {p}: {phaseInfo[p].name}</h3>
            <p className="text-sm text-slate-500 mt-2">{phaseInfo[p].desc}</p>
            <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-medium
              ${phase === p ? 'bg-blue-100 text-blue-700' : 'bg-white/5 text-slate-500'}`}>
              {phase === p ? '● Active' : 'Inactive'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamsView() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [memberIds, setMemberIds] = useState([]);

  useEffect(() => {
    Promise.all([getTeams(), getUsers()])
      .then(([t, u]) => { setTeams(t.data); setUsers(u.data); })
      .catch(console.error);
  }, []);

  const mentors = users.filter(u => u.role === 'Mentor');
  const students = users.filter(u => u.role === 'Student');

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team? This will also delete all associated submissions and meetings.')) return;
    try {
      await deleteTeam(id);
      const res = await getTeams();
      setTeams(res.data);
    } catch (err) {
      console.error('Delete error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error deleting team';
      alert(errorMsg);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createTeam({ name, mentor: mentorId, members: memberIds });
      const res = await getTeams();
      setTeams(res.data);
      setShowForm(false);
      setName(''); setMentorId(''); setMemberIds([]);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-200">Teams</h1>
          <p className="text-slate-500 mt-1">Manage project teams and assignments.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 cursor-pointer">
          + New Team
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10 mb-8 space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Team Name"
            className="w-full px-4 py-2.5 bg-[#161b22]/50 text-slate-200 border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={mentorId} onChange={e => setMentorId(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#161b22]/50 text-slate-200 border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Mentor</option>
            {mentors.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
          <select multiple value={memberIds} onChange={e => setMemberIds([...e.target.selectedOptions].map(o => o.value))}
            className="w-full px-4 py-2.5 bg-[#161b22]/50 text-slate-200 border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-28">
            {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <MagneticButton type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer">
            Create Team
          </MagneticButton>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map(t => (
          <div key={t._id} className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                     <h3 className="font-semibold text-slate-200">{t.name}</h3>
                     <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-mono font-bold border border-indigo-100">{t.teamNo || 'NO_ID'}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.members?.length || 0} members</p>
                </div>
              </div>
              <button onClick={() => handleDelete(t._id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                title="Delete Team">
                <span className="text-lg">🗑️</span>
              </button>
            </div>
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-1">Mentor</p>
              <p className="text-sm font-medium text-slate-300">{t.mentor?.name || 'Unassigned'}</p>
            </div>
            <ProgressBar progress={t.progress || 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersView() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers().then(r => setUsers(r.data)).catch(console.error);
  }, []);

  const roleColors = {
    Admin: 'bg-purple-100 text-purple-700',
    Mentor: 'bg-blue-100 text-blue-700',
    Student: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-200 mb-2">Users</h1>
      <p className="text-slate-500 mb-8">All registered users in the system.</p>
      <div className="glass-panel rounded-2xl shadow-sm border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#161b22]/50 border-b border-white/10">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Team</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b border-slate-50 hover:bg-[#161b22]/50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold">
                      {u.name?.[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-200">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">
                  {u.teamId?.teamNo ? (
                     <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{u.teamId.teamNo}</span>
                  ) : (
                     u.teamId?.name || '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectsView() {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', semester: '' });

  useEffect(() => {
    getSubjects().then(r => setSubjects(r.data)).catch(console.error);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSubject({ ...form, semester: Number(form.semester) });
      const res = await getSubjects();
      setSubjects(res.data);
      setShowForm(false);
      setForm({ name: '', code: '', semester: '' });
    } catch (err) { alert(err.response?.data?.message || 'Error creating subject'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-200">Subjects</h1>
          <p className="text-slate-500 mt-1">Manage project-based learning subjects and codes.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300 cursor-pointer">
          + New Subject
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10 mb-8 flex gap-4 items-end">
          <div className="flex-1">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name</label>
             <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Full Stack Development" required className="w-full px-4 py-2 bg-[#161b22]/50 text-slate-200 border border-white/20 rounded-xl text-sm" />
          </div>
          <div className="flex-1">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Code</label>
             <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. FULLSTACK" required className="w-full px-4 py-2 bg-[#161b22]/50 text-slate-200 border border-white/20 rounded-xl text-sm uppercase" />
          </div>
          <div className="w-24">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
             <input type="number" min="1" max="10" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} placeholder="e.g. 6" required className="w-full px-4 py-2 bg-[#161b22]/50 text-slate-200 border border-white/20 rounded-xl text-sm" />
          </div>
          <MagneticButton type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 cursor-pointer h-10">
            Save
          </MagneticButton>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map(s => (
          <div key={s._id} className="glass-panel p-5 rounded-2xl shadow-sm border border-white/10 hover:shadow-md transition-all">
             <div className="flex justify-between items-start mb-2">
                <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-md font-mono text-xs font-bold tracking-wider">{s.code}_{s.semester}</span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Sem {s.semester}</span>
             </div>
             <h3 className="font-semibold text-slate-200 text-lg mt-3">{s.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="phases" element={<PhaseControl />} />
        <Route path="subjects" element={<SubjectsView />} />
        <Route path="teams" element={<TeamsView />} />
        <Route path="users" element={<UsersView />} />
      </Routes>
    </DashboardLayout>
  );
}
