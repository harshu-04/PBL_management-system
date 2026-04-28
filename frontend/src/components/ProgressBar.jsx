export default function ProgressBar({ progress = 0, showSegments = false }) {
  const capped = Math.min(progress, 100);

  const segments = [
    { label: 'P1 Sub', threshold: 20, color: 'from-blue-500 to-blue-400', glow: 'neon-glow-blue' },
    { label: 'P1 Grade', threshold: 30, color: 'from-blue-400 to-cyan-400', glow: 'neon-glow-cyan' },
    { label: 'P2 Sub', threshold: 50, color: 'from-cyan-400 to-teal-400', glow: 'neon-glow-cyan' },
    { label: 'P2 Grade', threshold: 60, color: 'from-teal-400 to-emerald-400', glow: 'neon-glow-teal' },
    { label: 'P3 Sub', threshold: 80, color: 'from-emerald-400 to-green-400', glow: 'neon-glow-emerald' },
    { label: 'P3 Grade', threshold: 100, color: 'from-green-400 to-green-500', glow: 'neon-glow-green' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-300">Project Progress</span>
        <span className="text-sm font-bold text-slate-200">{capped}%</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden shadow-inner border border-slate-700">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-500 transition-all duration-700 ease-out neon-glow-cyan`}
          style={{ width: `${capped}%` }}
        />
      </div>
      {showSegments && (
        <div className="flex mt-3 gap-1">
          {segments.map((seg) => (
            <div key={seg.label} className="flex-1 text-center">
              <div className={`h-2 rounded-full ${capped >= seg.threshold ? `bg-gradient-to-r ${seg.color} ${seg.glow}` : 'bg-slate-800'} transition-all duration-500`} />
              <p className="text-[10px] text-slate-400 mt-1">{seg.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
