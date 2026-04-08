import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { getActivePhase, getTeams, getTeamSubmissions, gradeSubmission, getMeetings, updateMeetingStatus } from '../../utils/api';
import { getTeamReport, downloadPdfReport } from '../../utils/api';

function MentorOverview() {
  const { user } = useAuth();
  const [phase, setPhase] = useState(1);
  const [teams, setTeams] = useState([]);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, t, m] = await Promise.all([getActivePhase(), getTeams(), getMeetings()]);
        setPhase(p.data.activePhase);
        setTeams(t.data);
        setMeetings(m.data);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const pendingMeetings = meetings.filter(m => m.status === 'pending').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Welcome back, {user?.name} 👋</h1>
        <p className="text-slate-500 mt-1">Review submissions and manage your teams.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon="🎯" label="Active Phase" value={`Phase ${phase}`} color="purple" />
        <StatCard icon="👥" label="My Teams" value={teams.length} color="blue" />
        <StatCard icon="📅" label="Pending Meetings" value={pendingMeetings} color="orange" />
        <StatCard icon="📝" label="To Review" value="—" color="cyan" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">My Teams</h3>
        {teams.length === 0 ? (
          <p className="text-slate-400 text-sm">No teams assigned.</p>
        ) : (
          <div className="space-y-4">
            {teams.map(t => (
              <div key={t._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{t.name}</p>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-mono text-[10px] font-bold">{t.teamNo || 'NO_ID'}</span>
                    </div>
                    <p className="text-xs text-slate-500">{t.members?.length || 0} members</p>
                  </div>
                </div>
                <div className="w-40">
                  <div className="flex justify-end text-xs text-slate-500 mb-1">{t.progress || 0}%</div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${Math.min(t.progress || 0, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MentorTeams() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    getTeams().then(r => setTeams(r.data)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">My Teams</h1>
      <p className="text-slate-500 mb-8">Teams assigned to you for mentoring.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map(t => (
          <div key={t._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                {t.name?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-800">{t.name}</h3>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-mono font-bold border border-indigo-100">{t.teamNo || 'NO_ID'}</span>
                </div>
                <p className="text-sm text-slate-500">{t.members?.length || 0} members</p>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Members</h4>
              <div className="space-y-2">
                {t.members?.map(m => (
                  <div key={m._id} className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{m.name?.[0]}</div>
                    {m.name}
                  </div>
                ))}
              </div>
            </div>
            <ProgressBar progress={t.progress || 0} showSegments />
          </div>
        ))}
      </div>
    </div>
  );
}


function MentorSubmissions() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [phase, setPhase] = useState(1);
  const [grading, setGrading] = useState({});
  const [msg, setMsg] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    Promise.all([getTeams(), getActivePhase()])
      .then(([t, p]) => { setTeams(t.data); setPhase(p.data.activePhase); })
      .catch(console.error);
  }, []);

  const loadSubmissions = async (team) => {
    setSelectedTeam(team);
    setMsg('');
    setReport(null);
    try {
      const res = await getTeamSubmissions(team.teamNo);
      setSubmissions(res.data);
    } catch (err) { console.error(err); }
  };

  const handleGrade = async (subId, grade) => {
    setMsg('');
    try {
      const perfMap = grading[subId] || {};
      const performance = Object.keys(perfMap).map(studentId => ({
        studentId,
        marks: Number(perfMap[studentId].marks || 0),
        remark: perfMap[studentId].remark || ''
      }));
      await gradeSubmission(subId, { grade, performance });
      setMsg(`Submission ${grade === 1 ? 'Accepted' : 'Rejected'}!`);
      const res = await getTeamSubmissions(selectedTeam.teamNo);
      setSubmissions(res.data);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Grading failed');
    }
  };

  const generateReport = async () => {
    try {
      const res = await getTeamReport(selectedTeam.teamNo);
      setReport(res.data);
      setMsg('');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to generate report');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await downloadPdfReport(selectedTeam.teamNo);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTeam.teamNo}_Final_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMsg('Failed to download PDF report.');
    }
  };

  const phaseNames = { 1: 'Synopsis', 2: 'Development', 3: 'Final Review' };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Submissions & Grading</h1>
      <p className="text-slate-500 mb-6">Review submissions and evaluate individual student performance. Active: <span className="font-semibold text-blue-600">Phase {phase} ({phaseNames[phase]})</span></p>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg.includes('Canno') || msg.includes('failed') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {msg}
        </div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        {teams.map(t => (
          <button key={t._id} onClick={() => loadSubmissions(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer
              ${selectedTeam?._id === t._id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'}`}>
            {t.teamNo || t.name}
          </button>
        ))}
      </div>

      {report && (
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white p-8 rounded-2xl shadow-xl mb-8">
          <div className="flex justify-between items-center mb-6 border-b border-indigo-700 pb-4">
             <h2 className="text-2xl font-bold">Final Progress Report: {report.teamNo}</h2>
             <span className="px-4 py-1.5 bg-indigo-700 rounded-full font-mono font-bold text-sm">Overall Progress: {report.progress}%</span>
          </div>
          <div className="space-y-6">
             {report.report.map(r => (
               <div key={r.student._id} className="bg-white/10 p-5 rounded-xl border border-white/5">
                 <div className="flex justify-between items-center mb-3">
                   <h3 className="font-bold text-lg">{r.student.name}</h3>
                   <span className="text-xl font-black text-emerald-400">{r.totalMarks} / 30</span>
                 </div>
                 <div className="space-y-2">
                   {r.remarks.map((rmk, i) => (
                     <div key={i} className="text-sm bg-white/5 p-3 rounded-lg border-l-2 border-indigo-400">
                       {rmk}
                     </div>
                   ))}
                 </div>
               </div>
             ))}
          </div>
          <button onClick={() => setReport(null)} className="mt-6 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">Close Report</button>
        </div>
      )}

      {selectedTeam && !report && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
              <p className="text-slate-400">No submissions yet for this team.</p>
            </div>
          ) : (
            submissions.map(sub => (
              <div key={sub._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm
                      ${sub.grade === 1 ? 'bg-gradient-to-br from-green-500 to-emerald-500' : sub.grade === 0 ? 'bg-gradient-to-br from-red-500 to-rose-500' : 'bg-gradient-to-br from-orange-500 to-amber-500'}`}>
                      P{sub.phaseNumber}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Phase {sub.phaseNumber}: {phaseNames[sub.phaseNumber]}</h3>
                      <p className="text-xs text-slate-500">{new Date(sub.submittedAt || sub.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium
                    ${sub.grade === 1 ? 'bg-green-100 text-green-700' : sub.grade === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {sub.grade !== undefined && sub.grade !== null ? (sub.grade === 1 ? 'Accepted' : 'Rejected') : 'Pending Review'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Submission Details</p>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-xs text-slate-500 mb-1">Synopsis</p>
                       <a href={sub.synopsis} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium break-all whitespace-pre-wrap">
                         📄 {decodeURIComponent(sub.synopsis.split('/').pop().split('?')[0])}
                       </a>
                     </div>
                     <div>
                       <p className="text-xs text-slate-500 mb-1">GitHub Repo</p>
                       {sub.githubLink ? (
                         <a href={sub.githubLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium break-all">{sub.githubLink}</a>
                       ) : <p className="text-sm text-slate-400">Not provided</p>}
                     </div>
                  </div>
                </div>

                {sub.grade !== undefined && sub.grade !== null ? (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Student Evaluations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sub.performance?.map((perf, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${sub.grade === 1 ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                           <p className="font-medium text-slate-800 mb-1">{perf.studentId?.name || 'Student'}</p>
                           <p className="text-xs text-slate-500 mb-2">{perf.studentId?.email}</p>
                           <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold px-2 py-1 bg-white rounded shadow-sm border border-slate-100">{perf.marks}/10 Marks</span>
                           </div>
                           <p className="text-sm text-slate-700 italic">"{perf.remark}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : sub.phaseNumber === phase ? (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Evaluate Students (0-10 Marks)</h4>
                    <div className="space-y-3 mb-6">
                      {selectedTeam.members?.map(m => (
                        <div key={m._id} className="flex gap-3 bg-white p-3 border border-slate-200 rounded-xl items-center">
                           <div className="w-1/4">
                             <p className="font-medium text-sm text-slate-800 truncate">{m.name}</p>
                             <p className="text-xs text-slate-500 truncate">{m.email}</p>
                           </div>
                           <input type="number" min="0" max="10" placeholder="Marks"
                              value={grading[sub._id]?.[m._id]?.marks || ''}
                              onChange={e => setGrading(prev => ({ ...prev, [sub._id]: { ...prev[sub._id], [m._id]: { ...prev[sub._id]?.[m._id], marks: e.target.value } } }))}
                              className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm text-center" />
                           <input type="text" placeholder="Remark for this student..."
                              value={grading[sub._id]?.[m._id]?.remark || ''}
                              onChange={e => setGrading(prev => ({ ...prev, [sub._id]: { ...prev[sub._id], [m._id]: { ...prev[sub._id]?.[m._id], remark: e.target.value } } }))}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => handleGrade(sub._id, 1)}
                        className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all cursor-pointer">
                        Accept Submission (1)
                      </button>
                      <button onClick={() => handleGrade(sub._id, 0)}
                        className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all cursor-pointer">
                        Reject Submission (0)
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 italic">⚠ Cannot grade — this submission is from an inactive phase.</p>
                )}
                
                {/* Phase 3 Report Generation Trigger */}
                {phase === 3 && sub.phaseNumber === 3 && sub.grade !== undefined && sub.grade !== null && (
                   <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center gap-3">
                     <button onClick={generateReport} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md transition-all cursor-pointer">
                        📈 View Final Report
                     </button>
                     <button onClick={handleDownloadPdf} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 shadow-md transition-all cursor-pointer">
                        💾 Download PDF
                     </button>
                   </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MentorMeetings() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    getMeetings().then(r => setMeetings(r.data)).catch(console.error);
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await updateMeetingStatus(id, status);
      const res = await getMeetings();
      setMeetings(res.data);
    } catch (err) { console.error(err); }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Meeting Requests</h1>
      <p className="text-slate-500 mb-8">Manage meeting requests from your teams.</p>

      {meetings.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <p className="text-slate-400">No meeting requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map(m => (
            <div key={m._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg">
                  📅
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800">{m.teamId?.name || 'Team'}</p>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px] font-bold">{m.teamId?.teamNo || 'NO_ID'}</span>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(m.requestedTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[m.status]}`}>
                  {m.status}
                </span>
                {m.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStatus(m._id, 'accepted')}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 cursor-pointer">
                      Accept
                    </button>
                    <button onClick={() => handleStatus(m._id, 'rejected')}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MentorDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<MentorOverview />} />
        <Route path="teams" element={<MentorTeams />} />
        <Route path="submissions" element={<MentorSubmissions />} />
        <Route path="meetings" element={<MentorMeetings />} />
      </Routes>
    </DashboardLayout>
  );
}
