import React from 'react';
import { 
  TrendingDown, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  ArrowDownRight
} from 'lucide-react';

export default function MetricCards({ sessionData, costMetrics, fidelityData }) {
  const reductionPct = costMetrics?.token_reduction_pct ?? sessionData?.token_reduction_pct ?? 0;
  const rawTokens = costMetrics?.raw_tokens ?? sessionData?.raw_token_count ?? 0;
  const sirTokens = costMetrics?.sir_tokens ?? sessionData?.sir_token_count ?? 0;
  const tokensSaved = costMetrics?.tokens_saved ?? sessionData?.tokens_saved ?? 0;

  const costSavedUsd = costMetrics?.cost_saved_usd ?? sessionData?.cost_log?.cost_saved_usd ?? 0;
  const targetModel = sessionData?.target_model || 'gpt-4o';

  const fidelityScore = fidelityData?.score ?? sessionData?.fidelity_score ?? 0.95;
  const fidelityPct = fidelityData?.score_pct ?? Math.round(fidelityScore * 1000) / 10;
  const fidelityPassed = fidelityData?.passed ?? sessionData?.fidelity_passed ?? true;

  const compLatency = sessionData?.compression_latency_ms ?? 0;
  const infLatency = sessionData?.inference_latency_ms;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Token Reduction */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0d121c]/90 border border-slate-800/80 p-5 shadow-xl hover:border-sky-500/40 transition-all group backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-sky-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Token Reduction
          </span>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-sky-400 font-mono tracking-tight">
            {reductionPct > 0 ? `-${reductionPct.toFixed(1)}%` : '0%'}
          </span>
          <span className="text-xs text-slate-400 flex items-center font-mono">
            <ArrowDownRight className="w-3.5 h-3.5 text-sky-400 mr-0.5" />
            {tokensSaved} saved
          </span>
        </div>
        <div className="mt-3">
          <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, reductionPct))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
            <span>Raw: {rawTokens}</span>
            <span>d-SIR: {sirTokens}</span>
          </div>
        </div>
      </div>

      {/* 2. Dollar Cost Saved */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0d121c]/90 border border-slate-800/80 p-5 shadow-xl hover:border-emerald-500/40 transition-all group backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Cost Saved / Req
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            ${costSavedUsd.toFixed(6)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Tier: {targetModel}</span>
          <span className="text-emerald-400 font-medium">Direct savings</span>
        </div>
      </div>

      {/* 3. Semantic Fidelity Score */}
      <div className={`relative overflow-hidden rounded-2xl bg-[#0d121c]/90 border p-5 shadow-xl transition-all group backdrop-blur-xl ${
        fidelityPassed 
          ? 'border-slate-800/80 hover:border-purple-500/40' 
          : 'border-amber-500/40 shadow-amber-950/20'
      }`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-purple-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Semantic Fidelity
          </span>
          <div className={`p-2 rounded-xl border ${
            fidelityPassed 
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {fidelityPassed ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold font-mono tracking-tight ${
            fidelityPassed ? 'text-purple-400' : 'text-amber-400'
          }`}>
            {fidelityPct}%
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Cosine Sim
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Target: 88%–96%</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            fidelityPassed 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
          }`}>
            {fidelityPassed ? 'FIDELITY HIGH' : 'WARNING (<85%)'}
          </span>
        </div>
      </div>

      {/* 4. Gateway Latency */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0d121c]/90 border border-slate-800/80 p-5 shadow-xl hover:border-indigo-500/40 transition-all group backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Pipeline Latency
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-indigo-400 font-mono tracking-tight">
            {Math.round(compLatency + (infLatency || 0))}ms
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Comp: {Math.round(compLatency)}ms</span>
          <span>Infer: {infLatency ? `${Math.round(infLatency)}ms` : '—'}</span>
        </div>
      </div>

    </div>
  );
}
