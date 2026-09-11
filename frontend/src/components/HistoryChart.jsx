import React from 'react';
import { 
  RefreshCw, 
  History, 
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
    <div className="bg-surface-card border border-hairline rounded-lg p-6 sm:p-8 shadow-claude-subtle mt-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-hairline">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-canvas border border-hairline flex items-center justify-center text-primary">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-serif text-ink font-normal tracking-tight">
              Optimization History & Token Metrics
            </h3>
            <p className="text-sm text-body mt-0.5">
              Historical token reduction ratios and financial metrics across gateway sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-canvas border border-hairline px-3.5 py-2 rounded-md">
              <span className="text-muted">Avg Reduction: </span>
              <span className="text-primary font-semibold">{summary.avg_reduction_pct}%</span>
            </div>
            <div className="bg-canvas border border-hairline px-3.5 py-2 rounded-md">
              <span className="text-muted">Total Saved: </span>
              <span className="text-semantic-success font-semibold">${summary.total_dollars_saved_usd.toFixed(4)}</span>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-md bg-canvas border border-hairline text-body hover:text-ink hover:bg-surface-soft transition-colors shadow-claude-subtle"
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
                  <stop offset="5%" stopColor="#cc785c" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#cc785c" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="fidelityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5db8a6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5db8a6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6dfd8" />
              <XAxis dataKey="time" stroke="#8e8b82" fontSize={11} />
              <YAxis stroke="#8e8b82" fontSize={11} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#faf9f5', 
                  borderColor: '#e6dfd8',
                  borderRadius: '8px',
                  color: '#141413',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxShadow: '0 4px 12px rgba(20,20,19,0.08)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="reduction" 
                name="Token Reduction %" 
                stroke="#cc785c" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#reductionGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="fidelity" 
                name="Fidelity %" 
                stroke="#5db8a6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#fidelityGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 text-center text-muted text-xs">
          No historical compression logs yet. Run your first prompt compilation above!
        </div>
      )}

      {/* History Table */}
      {sessions.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-body">
            <thead className="bg-canvas text-muted uppercase font-mono text-[10px] tracking-wider border-b border-hairline">
              <tr>
                <th className="py-3 px-3.5">Session</th>
                <th className="py-3 px-3.5">Model</th>
                <th className="py-3 px-3.5">Engine</th>
                <th className="py-3 px-3.5 text-right">Raw / SIR Tokens</th>
                <th className="py-3 px-3.5 text-right">Reduction</th>
                <th className="py-3 px-3.5 text-right">Fidelity</th>
                <th className="py-3 px-3.5 text-right">Cost Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline font-mono">
              {sessions.slice(0, 8).map((s) => (
                <tr 
                  key={s.id} 
                  onClick={() => onSelectSession && onSelectSession(s)}
                  className="hover:bg-canvas transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3.5 text-primary font-medium">
                    {s.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-3.5 text-body-strong">{s.target_model}</td>
                  <td className="py-3 px-3.5 text-muted">{s.compression_engine}</td>
                  <td className="py-3 px-3.5 text-right text-muted">
                    {s.raw_token_count} → {s.sir_token_count}
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold text-primary">
                    -{s.token_reduction_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <span className={`inline-flex items-center gap-1 ${
                      s.fidelity_passed ? 'text-semantic-success' : 'text-semantic-warning'
                    }`}>
                      {s.fidelity_passed ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {(s.fidelity_score * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-semantic-success">
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
