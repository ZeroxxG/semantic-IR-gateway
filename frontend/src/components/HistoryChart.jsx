import React from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  History, 
  TrendingDown, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function HistoryChart({
  historyData,
  onRefresh,
  onSelectSession
}) {
  const sessions = historyData?.history || [];
  
  // Format for recharts (chronological)
  const chartData = [...sessions].reverse().map((item, idx) => ({
    id: item.id.slice(0, 6),
    reduction: item.token_reduction_pct,
    tokensSaved: item.tokens_saved,
    fidelity: Math.round(item.fidelity_score * 100),
    model: item.target_model,
    savedUsd: item.cost_log?.cost_saved_usd || 0,
    time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  const summary = historyData?.summary || {
    total_tokens_saved: 0,
    total_dollars_saved_usd: 0,
    avg_reduction_pct: 0
  };

  return (
    <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl p-6 mt-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Optimization History & Token Metrics
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
                {sessions.length} Recorded
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Historical token reduction ratios and financial metrics across gateway sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-[#121826] border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Avg Reduction: </span>
              <span className="text-sky-400 font-bold">{summary.avg_reduction_pct}%</span>
            </div>
            <div className="bg-[#121826] border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Total Saved: </span>
              <span className="text-emerald-400 font-bold">${summary.total_dollars_saved_usd.toFixed(4)}</span>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart View */}
      {chartData.length > 0 ? (
        <div className="mt-6 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reductionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="fidelityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="reduction" 
                name="Token Reduction %" 
                stroke="#38bdf8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#reductionGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="fidelity" 
                name="Fidelity %" 
                stroke="#a855f7" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#fidelityGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500 text-xs">
          No historical compression logs yet. Run your first prompt compilation above!
        </div>
      )}

      {/* History Table */}
      {sessions.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#121826] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Engine</th>
                <th className="py-2.5 px-3 text-right">Raw / SIR Tokens</th>
                <th className="py-2.5 px-3 text-right">Reduction</th>
                <th className="py-2.5 px-3 text-right">Fidelity</th>
                <th className="py-2.5 px-3 text-right">Cost Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sessions.slice(0, 8).map((s) => (
                <tr 
                  key={s.id} 
                  onClick={() => onSelectSession && onSelectSession(s)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 text-sky-400 flex items-center gap-1">
                    {s.id.slice(0, 8)}...
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{s.target_model}</td>
                  <td className="py-2.5 px-3 text-purple-300">{s.compression_engine}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {s.raw_token_count} → {s.sir_token_count}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-sky-400">
                    -{s.token_reduction_pct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 ${
                      s.fidelity_passed ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {s.fidelity_passed ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {(s.fidelity_score * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    ${(s.cost_log?.cost_saved_usd || 0).toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
