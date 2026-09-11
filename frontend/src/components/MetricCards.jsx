import React from 'react';
import { 
  TrendingDown, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  ArrowDownRight
} from 'lucide-react';

export default function MetricCards({ sessionData, costMetrics, fidelityData, isPassthrough }) {
  const reductionPct = costMetrics?.token_reduction_pct ?? sessionData?.token_reduction_pct ?? 0;
  const rawTokens = costMetrics?.raw_tokens ?? sessionData?.raw_token_count ?? 0;
  const sirTokens = costMetrics?.sir_tokens ?? sessionData?.sir_token_count ?? 0;
  const tokensSaved = costMetrics?.tokens_saved ?? sessionData?.tokens_saved ?? 0;

  const costSavedUsd = costMetrics?.cost_saved_usd ?? sessionData?.cost_log?.cost_saved_usd ?? 0;
  const targetModel = sessionData?.target_model || 'gpt-4o';

  const fidelityScore = fidelityData?.score ?? sessionData?.fidelity_score ?? 1.0;
  const fidelityPct = fidelityData?.score_pct ?? Math.round(fidelityScore * 1000) / 10;
  const fidelityPassed = fidelityData?.passed ?? sessionData?.fidelity_passed ?? true;

  const compLatency = sessionData?.compression_latency_ms ?? 0;
  const infLatency = sessionData?.inference_latency_ms;

  const passthroughActive = isPassthrough || sessionData?.status?.includes('PASSTHROUGH');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      
      {/* 1. Token Reduction / Pass-Through */}
      <div className="bg-surface-card border border-hairline rounded-lg p-6 shadow-claude-subtle flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            {passthroughActive ? 'Pass-Through Guard' : 'Token Reduction'}
          </span>
          <div className="w-8 h-8 rounded-md bg-canvas border border-hairline flex items-center justify-center text-primary">
            {passthroughActive ? <ShieldCheck className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-serif text-ink font-normal tracking-tight">
            {passthroughActive ? '0.0%' : (reductionPct > 0 ? `-${reductionPct.toFixed(1)}%` : '0%')}
          </span>
          <span className="text-xs text-muted font-mono flex items-center">
            {passthroughActive ? (
              <span className="text-primary font-semibold">Optimal</span>
            ) : (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-primary mr-0.5" />
                {tokensSaved} saved
              </>
            )}
          </span>
        </div>

        <div className="mt-4">
          <div className="w-full h-1.5 bg-surface-cream-strong rounded-pill overflow-hidden">
            <div 
              className={`h-full rounded-pill transition-all duration-500 ease-out ${
                passthroughActive ? 'bg-primary w-full' : 'bg-primary'
              }`}
              style={{ width: passthroughActive ? '100%' : `${Math.min(100, Math.max(0, reductionPct))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-soft mt-2 font-mono">
            <span>Raw: {rawTokens}</span>
            <span>{passthroughActive ? 'Pass-through: ' + rawTokens : 'd-SIR: ' + sirTokens}</span>
          </div>
        </div>
      </div>

      {/* 2. Dollar Cost Saved */}
      <div className="bg-surface-card border border-hairline rounded-lg p-6 shadow-claude-subtle flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Cost Saved / Req
          </span>
          <div className="w-8 h-8 rounded-md bg-canvas border border-hairline flex items-center justify-center text-semantic-success">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-serif text-ink font-normal tracking-tight">
            ${costSavedUsd.toFixed(6)}
          </span>
        </div>

        <div className="mt-4 pt-2 border-t border-hairline-soft flex items-center justify-between text-xs text-muted font-mono">
          <span>Tier: {targetModel}</span>
          <span className="text-body font-medium">{passthroughActive ? 'Zero inflation' : 'Net savings'}</span>
        </div>
      </div>

      {/* 3. Semantic Fidelity Score */}
      <div className="bg-surface-card border border-hairline rounded-lg p-6 shadow-claude-subtle flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Semantic Fidelity
          </span>
          <div className={`w-8 h-8 rounded-md bg-canvas border border-hairline flex items-center justify-center ${
            fidelityPassed ? 'text-accent-teal' : 'text-semantic-warning'
          }`}>
            {fidelityPassed ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-serif text-ink font-normal tracking-tight">
            {fidelityPct}%
          </span>
          <span className="text-xs text-muted font-mono">
            {passthroughActive ? '100% Preserved' : 'Cosine Sim'}
          </span>
        </div>

        <div className="mt-4 pt-2 border-t border-hairline-soft flex items-center justify-between text-xs font-mono">
          <span className="text-muted">Target: 88%–96%</span>
          <span className={`px-2 py-0.5 rounded-pill text-[10px] font-medium ${
            fidelityPassed 
              ? 'bg-canvas text-body border border-hairline' 
              : 'bg-canvas text-semantic-warning border border-semantic-warning/30'
          }`}>
            {passthroughActive ? 'OPTIMAL' : (fidelityPassed ? 'HIGH FIDELITY' : 'REVIEW')}
          </span>
        </div>
      </div>

      {/* 4. Gateway Latency */}
      <div className="bg-surface-card border border-hairline rounded-lg p-6 shadow-claude-subtle flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Pipeline Latency
          </span>
          <div className="w-8 h-8 rounded-md bg-canvas border border-hairline flex items-center justify-center text-body">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-serif text-ink font-normal tracking-tight">
            {Math.round(compLatency + (infLatency || 0))}ms
          </span>
        </div>

        <div className="mt-4 pt-2 border-t border-hairline-soft flex items-center justify-between text-xs text-muted font-mono">
          <span>Comp: {Math.round(compLatency)}ms</span>
          <span>Infer: {infLatency ? `${Math.round(infLatency)}ms` : '—'}</span>
        </div>
      </div>

    </div>
  );
}
