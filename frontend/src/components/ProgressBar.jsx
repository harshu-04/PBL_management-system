export default function ProgressBar({ progress = 0, showSegments = false }) {
  const capped = Math.min(progress, 100);

  const segments = [
    { label: 'P1 Sub', threshold: 20, color: 'from-blue-500 to-blue-400' },
    { label: 'P1 Grade', threshold: 30, color: 'from-blue-400 to-cyan-400' },
    { label: 'P2 Sub', threshold: 50, color: 'from-cyan-400 to-teal-400' },
    { label: 'P2 Grade', threshold: 60, color: 'from-teal-400 to-emerald-400' },
    { label: 'P3 Sub', threshold: 80, color: 'from-emerald-400 to-green-400' },
    { label: 'P3 Grade', threshold: 100, color: 'from-green-400 to-green-500' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-700">Project Progress</span>
        <span className="text-sm font-bold text-slate-800">{capped}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-500 transition-all duration-700 ease-out"
          style={{ width: `${capped}%` }}
        />
      </div>
      {showSegments && (
        <div className="flex mt-3 gap-1">
          {segments.map((seg) => (
            <div key={seg.label} className="flex-1 text-center">
              <div className={`h-2 rounded-full ${capped >= seg.threshold ? `bg-gradient-to-r ${seg.color}` : 'bg-slate-200'} transition-all duration-500`} />
              <p className="text-[10px] text-slate-500 mt-1">{seg.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
