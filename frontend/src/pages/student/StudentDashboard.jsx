import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import MagneticButton from '../../components/MagneticButton';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { getActivePhase, getTeams, getTeamSubmissions, submitPhase, getMeetings, requestMeeting, getSubjects, createTeam, joinTeam } from '../../utils/api';

const TeamContext = createContext();
export const useTeamContext = () => useContext(TeamContext);

function StudentOverview() {
  const { user } = useAuth();
  const { activeTeam } = useTeamContext();
  const [phase, setPhase] = useState(1);
  const [submissions, setSubmissions] = useState([]);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    if (!activeTeam) return;
    const load = async () => {
      try {
        const [p, m] = await Promise.all([getActivePhase(), getMeetings()]);
        setPhase(p.data.activePhase);
        const subs = await getTeamSubmissions(activeTeam.teamNo);
        setSubmissions(subs.data);
        // Filter meetings specifically for the active team
        setMeetings(m.data.filter(mtg => mtg.teamId?._id === activeTeam._id || mtg.teamId === activeTeam._id));
      } catch (err) { console.error(err); }
    };
    load();
  }, [activeTeam]);

  const phaseNames = { 1: 'Synopsis', 2: 'Development', 3: 'Final Review' };
  const submittedCurrent = submissions.some(s => s.phaseNumber === phase);
  const pendingMeetings = meetings.filter(m => m.status === 'pending').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-200">Welcome back, {user?.name} 👋</h1>
        <p className="text-slate-500 mt-1">Track your project progress and submit your work for {activeTeam?.name || 'this team'}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon="🎯" label="Current Phase" value={`${phaseNames[phase]}`} color="purple" />
        <StatCard icon="👥" label="My Team" value={activeTeam?.teamNo || activeTeam?.name || '—'} color="blue" />
        <StatCard icon="📤" label="Phase Status" value={submittedCurrent ? 'Submitted' : 'Pending'} color={submittedCurrent ? 'green' : 'orange'} />
        <StatCard icon="📅" label="Meetings" value={pendingMeetings} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl shadow-sm border border-white/10">
          <ProgressBar progress={activeTeam?.progress || 0} showSegments />

          {!activeTeam && (
            <div className="mt-8">
              <CreateJoinTeam onTeamJoined={() => window.location.reload()} />
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Submission History</h3>
            {submissions.length === 0 ? (
              <p className="text-slate-400 text-sm">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map(sub => (
                  <div key={sub._id} className="flex items-center justify-between p-3 bg-[#161b22]/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold
                        ${sub.grade === 1 ? 'bg-green-500' : sub.grade === 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
                        P{sub.phaseNumber}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-300">Phase {sub.phaseNumber}: {phaseNames[sub.phaseNumber]}</p>
                        <p className="text-xs text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${sub.grade === 1 ? 'bg-green-100 text-green-700' : sub.grade === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sub.grade !== undefined && sub.grade !== null ? (sub.grade === 1 ? 'Accepted' : 'Rejected') : 'Awaiting Grade'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Team Members</h3>
          {activeTeam?.members?.map(m => (
            <div key={m._id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                {m.name?.[0] || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">{m.name}</p>
                <p className="text-xs text-slate-500">{m.email}</p>
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-slate-500">Mentor</p>
            <p className="text-sm font-medium text-slate-300">{activeTeam?.mentor?.name || 'Unassigned'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateJoinTeam({ onTeamJoined }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [mode, setMode] = useState('create');
  const [subjectId, setSubjectId] = useState('');
  const [teamNo, setTeamNo] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.data)).catch(console.error);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subjectId) return setMsg({ text: 'Please select a subject', type: 'error' });
    setLoading(true); setMsg({ text: '', type: '' });
    try {
      const res = await createTeam({ subjectId });
      setMsg({ text: 'Team created successfully!', type: 'success' });
      onTeamJoined(res.data);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create team', type: 'error' });
    }
    setLoading(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!teamNo) return setMsg({ text: 'Please enter a Team No', type: 'error' });
    setLoading(true); setMsg({ text: '', type: '' });
    try {
      const res = await joinTeam({ teamNo: teamNo.toUpperCase() });
      setMsg({ text: 'Joined team successfully!', type: 'success' });
      onTeamJoined(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setMsg({ text: `Semester mismatch! ${err.response.data.message}`, type: 'error' });
      } else {
        setMsg({ text: err.response?.data?.message || 'Failed to join team', type: 'error' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel rounded-2xl shadow-sm border border-white/10 overflow-hidden w-full max-w-2xl mx-auto">
      <div className="flex border-b border-white/10">
        <button onClick={() => setMode('create')} className={`flex-1 py-4 font-semibold text-sm transition-colors ${mode === 'create' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-[#161b22]/50'}`}>Create a Team</button>
        <button onClick={() => setMode('join')} className={`flex-1 py-4 font-semibold text-sm transition-colors ${mode === 'join' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-[#161b22]/50'}`}>Join a Team</button>
      </div>

      {msg.text && (
        <div className={`m-6 mb-0 p-4 rounded-xl text-sm font-medium border ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="p-8">
        {mode === 'create' ? (
          <form onSubmit={handleCreate}>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Subject Area
              {user?.semester && <span className="text-xs text-blue-600 ml-2 font-normal">(Showing subjects for Semester {user.semester})</span>}
            </label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required
              className="w-full px-4 py-3 bg-[#161b22]/50 border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6">
              <option value="">-- Choose a Subject --</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code}_{s.semester})</option>)}
            </select>
            <MagneticButton type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">
              {loading ? 'Creating...' : 'Create Team & Auto-Assign Mentor'}
            </MagneticButton>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <label className="block text-sm font-medium text-slate-300 mb-2">Team Number</label>
            <input type="text" value={teamNo} onChange={e => setTeamNo(e.target.value)} placeholder="e.g. FULLSTACK_6_01" required
              className="w-full px-4 py-3 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 uppercase" />
            <MagneticButton type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">
              {loading ? 'Joining...' : 'Join Team'}
            </MagneticButton>
          </form>
        )}
      </div>
    </div>
  );
}

function EmptyStateWelcome({ onTeamJoined }) {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">👋</div>
        <h1 className="text-3xl font-bold text-slate-200">Welcome to PBL</h1>
        <p className="text-slate-500 mt-2">You are not in a team yet. Create a new team or join an existing one to get started.</p>
      </div>
      <CreateJoinTeam onTeamJoined={onTeamJoined} />
    </div>
  );
}

function SubmitWork() {
  const { activeTeam, refreshTeams } = useTeamContext();
  const [phase, setPhase] = useState(1);
  const [synopsisFile, setSynopsisFile] = useState(null);
  const [githubLink, setGithubLink] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTeam) return;
    const load = async () => {
      try {
        const p = await getActivePhase();
        setPhase(p.data.activePhase);
        const subs = await getTeamSubmissions(activeTeam.teamNo);
        setSubmissions(subs.data);
      } catch (err) { console.error(err); }
    };
    load();
  }, [activeTeam]);

  const currentSub = submissions.find(s => s.phaseNumber === phase);
  const isRejected = currentSub && currentSub.grade === 0;
  const isAccepted = currentSub && currentSub.grade === 1;
  const isPending = currentSub && (currentSub.grade === null || currentSub.grade === undefined);

  // ACADEMIC GUARDRAIL: Block if Accepted or Pending. Allow if Rejected or Not Submitted.
  const blockSubmission = currentSub && (isAccepted || isPending);

  const phaseNames = { 1: 'Synopsis', 2: 'Development', 3: 'Final Review' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!synopsisFile || !activeTeam) return setMsg('Please select a PDF file to upload.');
    setLoading(true); setMsg('');
    try {
      const formData = new FormData();
      formData.append('synopsis', synopsisFile);
      formData.append('teamNo', activeTeam.teamNo);
      if (githubLink) formData.append('githubLink', githubLink);

      await submitPhase(formData);
      setMsg('Submission successful! Your PDF has been uploaded.');
      setSynopsisFile(null);
      setGithubLink('');
      const fileInput = document.getElementById('synopsis-upload');
      if (fileInput) fileInput.value = '';
      const subs = await getTeamSubmissions(activeTeam.teamNo);
      setSubmissions(subs.data);
      refreshTeams();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Submission failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-200 mb-2">Submit Work</h1>
      <p className="text-slate-500 mb-8">Submit your project work for <span className="font-semibold text-blue-600">Phase {phase}: {phaseNames[phase]}</span></p>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${msg.includes('successful') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}

      {isRejected && (
        <div className="mb-6 p-5 bg-red-50 border border-red-100 rounded-2xl">
          <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
             <span>⚠️</span> Resubmission Required
          </div>
          <p className="text-sm text-red-600 mb-2">Your previous submission was rejected. Please address mentor feedback before resubmitting.</p>
          {currentSub.feedback && (
            <div className="text-xs glass-panel/50 p-3 rounded-lg text-slate-300 font-mono border border-red-50">
               <b>Feedback:</b> {currentSub.feedback}
            </div>
          )}
        </div>
      )}

      {blockSubmission ? (
        <div className="glass-panel p-8 rounded-2xl shadow-sm border border-white/10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl">
            {isAccepted ? '✅' : '⏳'}
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            {isAccepted ? `Phase ${phase} Accepted` : `Phase ${phase} Pending Review`}
          </h3>
          <p className="text-slate-500 text-sm">
            {isAccepted 
              ? `Your team has successfully cleared Phase ${phase}.`
              : 'Your team has already submitted work for this phase. Wait for your mentor to review and grade it.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Synopsis PDF Upload <span className="text-red-500">*</span>
            </label>
            <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${synopsisFile ? 'border-blue-400 bg-blue-50' : 'border-white/20 hover:border-blue-300'}`}>
              <input
                id="synopsis-upload"
                type="file"
                accept="application/pdf"
                onChange={e => setSynopsisFile(e.target.files[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="pointer-events-none">
                <div className="text-4xl mb-3">{synopsisFile ? '📄' : '☁️'}</div>
                {synopsisFile ? (
                  <p className="text-sm font-semibold text-blue-700">{synopsisFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-300">Click or drag & drop your PDF here</p>
                    <p className="text-xs text-slate-400 mt-1">PDF only · Max 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">GitHub Repository Link</label>
            <input
              type="url"
              value={githubLink}
              onChange={e => setGithubLink(e.target.value)}
              placeholder="Optional: https://github.com/..."
              className="w-full px-4 py-3 border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Team: {activeTeam?.teamNo}</p>
            <MagneticButton type="submit" disabled={loading || !synopsisFile}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 disabled:opacity-50 cursor-pointer">
              {loading ? 'Uploading...' : isRejected ? '📤 Update & Resubmit' : '🚀 Submit Phase'}
            </MagneticButton>
          </div>
        </form>
      )}
    </div>
  );
}

function StudentProgress() {
  const { activeTeam } = useTeamContext();
  const [submissions, setSubmissions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!activeTeam) return;
    const load = async () => {
      try {
        const subs = await getTeamSubmissions(activeTeam._id);
        setSubmissions(subs.data);
      } catch (err) { console.error(err); }
    };
    load();
  }, [activeTeam]);

  const phaseNames = { 1: 'Synopsis', 2: 'Development', 3: 'Final Review' };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-200 mb-2">Progress Tracker</h1>
      <p className="text-slate-500 mb-8">Your team's progress through the project lifecycle.</p>

      <div className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10 mb-8">
        <ProgressBar progress={activeTeam?.progress || 0} showSegments />
      </div>

      <h3 className="text-lg font-semibold text-slate-200 mb-4">Phase Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map(p => {
          const sub = submissions.find(s => s.phaseNumber === p);
          return (
            <div key={p} className={`glass-panel p-6 rounded-2xl shadow-sm border-2 transition-all
              ${sub?.grade === 1 ? 'border-green-300 bg-green-50/30' : sub?.grade === 0 ? 'border-red-300 bg-red-50/30' : sub ? 'border-amber-300 bg-amber-50/30' : 'border-white/10'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm
                  ${sub?.grade === 1 ? 'bg-green-500' : sub?.grade === 0 ? 'bg-red-500' : sub ? 'bg-amber-500' : 'bg-slate-300'}`}>
                  {p}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Phase {p}</h4>
                  <p className="text-xs text-slate-500">{phaseNames[p]}</p>
                </div>
              </div>
              {sub ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className={`font-medium ${sub.grade === 1 ? 'text-green-600' : sub.grade === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {sub.grade !== undefined && sub.grade !== null ? 'Graded' : 'Submitted'}
                    </span>
                  </div>
                  {sub.grade !== undefined && sub.grade !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Outcome</span>
                      <span className="font-bold text-slate-200">{sub.grade === 1 ? 'Accepted' : 'Rejected'}</span>
                    </div>
                  )}
                  {sub.performance && Array.isArray(sub.performance) && sub.performance.find(perf => perf.studentId?._id === user?._id || perf.studentId === user?._id) && (
                    <div className="mt-3 p-3 glass-panel border border-white/10 rounded-lg shadow-sm">
                      <p className="text-xs font-semibold text-slate-300 uppercase mb-1">My Performance</p>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Marks:</span>
                        <span className="font-bold text-slate-200">{sub.performance.find(perf => perf.studentId?._id === user?._id || perf.studentId === user?._id).marks}/10</span>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{sub.performance.find(perf => perf.studentId?._id === user?._id || perf.studentId === user?._id).remark}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Not yet submitted.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StudentMeetings() {
  const { activeTeam } = useTeamContext();
  const [meetings, setMeetings] = useState([]);
  const [requestedTime, setRequestedTime] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!activeTeam) return;
    const load = async () => {
      try {
        const m = await getMeetings();
        setMeetings(m.data.filter(mtg => mtg.teamId?._id === activeTeam._id || mtg.teamId === activeTeam._id));
      } catch (err) { console.error(err); }
    };
    load();
  }, [activeTeam]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!activeTeam) return;
    setMsg('');
    try {
      await requestMeeting({
        teamId: activeTeam._id,
        requestedTime: new Date(requestedTime).toISOString(),
        mentorId: activeTeam.mentor?._id || activeTeam.mentor
      });
      setMsg('Meeting requested!');
      setRequestedTime('');
      const res = await getMeetings();
      setMeetings(res.data.filter(mtg => mtg.teamId?._id === activeTeam._id || mtg.teamId === activeTeam._id));
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to request meeting');
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-200 mb-2">Meetings</h1>
      <p className="text-slate-500 mb-8">Request and track meetings with your mentor for {activeTeam?.teamNo || activeTeam?.name}.</p>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${msg.includes('requested') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleRequest} className="glass-panel p-6 rounded-2xl shadow-sm border border-white/10 mb-8">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Request a Meeting</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Time</label>
            <input type="datetime-local" value={requestedTime}
              onChange={e => setRequestedTime(e.target.value)} required
              className="w-full px-4 py-2.5 border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <MagneticButton type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all cursor-pointer">
            Request
          </MagneticButton>
        </div>
      </form>

      <h3 className="text-lg font-semibold text-slate-200 mb-4">Meeting History</h3>
      {meetings.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl shadow-sm border border-white/10 text-center">
          <p className="text-slate-400">No meetings scheduled yet for this team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => (
            <div key={m._id} className="glass-panel p-5 rounded-2xl shadow-sm border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg">
                  📅
                </div>
                <div>
                  <p className="font-medium text-slate-200">Meeting with Mentor</p>
                  <p className="text-xs text-slate-500">{new Date(m.requestedTime).toLocaleString()}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[m.status]}`}>
                {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateJoin, setShowCreateJoin] = useState(false);

  const loadTeams = async () => {
    try {
      const res = await getTeams();
      setTeams(res.data);
      if (res.data.length > 0 && !activeTeamId) {
        setActiveTeamId(res.data[0]._id);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadTeams(); }, []);

  if (loading) return <DashboardLayout>Loading...</DashboardLayout>;

  // Empty State => Show ONLY CreateJoin, 100% full screen intercept
  if (teams.length === 0) {
    return (
      <DashboardLayout>
        <EmptyStateWelcome onTeamJoined={async (newTeam) => {
          await loadTeams();
          setActiveTeamId(newTeam._id);
        }} />
      </DashboardLayout>
    );
  }

  const activeTeam = teams.find(t => t._id === activeTeamId) || teams[0];

  return (
    <DashboardLayout>
      {/* Team Selector Header Context Switcher */}
      <div className="glass-panel p-3 rounded-2xl shadow-sm border border-white/10 mb-8 flex items-center justify-between">
        <div className="flex gap-2">
          {teams.map((t, idx) => (
            <button key={t._id} onClick={() => { setActiveTeamId(t._id); setShowCreateJoin(false); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border
                ${activeTeamId === t._id ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-[#161b22]/50 hover:text-slate-300'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${activeTeamId === t._id ? 'bg-blue-600' : 'bg-transparent'}`} />
                {t.teamNo || t.name || `Team ${idx + 1}`}
              </div>
              </button>
          ))}
        </div>

        {teams.length < 2 && !showCreateJoin && (
          <button onClick={() => setShowCreateJoin(true)}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">
            + Join / Create 2nd Team
          </button>
        )}
        {teams.length === 2 && (
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 bg-[#161b22]/50 rounded-lg">
            Max Teams Reached (2/2)
          </div>
        )}
      </div>

      {showCreateJoin && teams.length < 2 && (
        <div className="mb-8 relative p-6 bg-[#161b22]/50 border border-white/20 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-200">Add Second Team</h2>
            <button onClick={() => setShowCreateJoin(false)} className="px-3 py-1 glass-panel border border-white/20 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300">Cancel</button>
          </div>
          <CreateJoinTeam onTeamJoined={async (newTeam) => {
            await loadTeams();
            setActiveTeamId(newTeam._id);
            setShowCreateJoin(false);
          }} />
        </div>
      )}

      {/* Inject selected team context to dynamic routed components below */}
      {!showCreateJoin && (
        <TeamContext.Provider value={{ activeTeam, refreshTeams: loadTeams }}>
          <Routes>
            <Route index element={<StudentOverview />} />
            <Route path="submit" element={<SubmitWork />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="meetings" element={<StudentMeetings />} />
          </Routes>
        </TeamContext.Provider>
      )}
    </DashboardLayout>
  );
}