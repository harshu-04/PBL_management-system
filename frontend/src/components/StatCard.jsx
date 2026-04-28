export default function StatCard({ icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    cyan: 'from-cyan-500 to-cyan-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-sm border border-white/10 hover:shadow-[0_4px_30px_rgba(59,130,246,0.1)] transition-shadow duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white text-xl shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-200">{value}</p>
        </div>
      </div>
    </div>
  );
}
