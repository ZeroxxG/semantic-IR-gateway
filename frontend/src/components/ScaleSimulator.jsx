import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';

const PRICING_TIERS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', inputRate: 2.50, color: 'text-sky-400', bg: 'border-sky-500/30' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputRate: 3.00, color: 'text-amber-400', bg: 'border-amber-500/30' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', inputRate: 1.25, color: 'text-indigo-400', bg: 'border-indigo-500/30' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', inputRate: 0.075, color: 'text-emerald-400', bg: 'border-emerald-500/30' },
];

export default function ScaleSimulator({ tokensSavedPerReq = 120, tokenReductionPct = 65 }) {
  const [monthlyVolume, setMonthlyVolume] = useState(100000); // 100k default

  const effectiveTokensSaved = tokensSavedPerReq > 0 ? tokensSavedPerReq : 120;

  const quickVolumes = [
    { label: '10K', value: 10000 },
    { label: '100K', value: 100000 },
    { label: '500K', value: 500000 },
    { label: '1M', value: 1000000 },
    { label: '5M', value: 5000000 },
    { label: '10M', value: 10000000 },
  ];

  const calculateSavings = (ratePer1M) => {
    const singleReqSaved = (effectiveTokensSaved / 1000000.0) * ratePer1M;
    const monthlySaved = singleReqSaved * monthlyVolume;
    const annualSaved = monthlySaved * 12;
    return {
      monthlySaved: monthlySaved,
      annualSaved: annualSaved,
    };
  };

  const totalTokensSavedMonthly = (effectiveTokensSaved * monthlyVolume);
  const totalTokensSavedAnnual = totalTokensSavedMonthly * 12;

  return (
    <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl p-6 mt-6">
      
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Enterprise Scale Financial Simulator
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Live ROI Projection
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Project annual operational dollar savings based on your team's production API volume
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#121826] border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs">
          <span className="text-slate-400">Tokens saved / req:</span>
          <span className="font-bold text-sky-400">{effectiveTokensSaved}</span>
          <span className="text-slate-500">({tokenReductionPct.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Interactive Volume Slider */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-sky-400" />
            Monthly Prompt Volume (Requests / Month):
          </label>
          <span className="text-lg font-mono font-extrabold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-0.5 rounded-lg">
            {monthlyVolume.toLocaleString()} reqs / mo
          </span>
        </div>

        <input
          type="range"
          min="10000"
          max="10000000"
          step="10000"
          value={monthlyVolume}
          onChange={(e) => setMonthlyVolume(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />

        {/* Quick Tiers */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <span className="text-[11px] text-slate-500">Quick volume presets:</span>
          <div className="flex items-center gap-1.5">
            {quickVolumes.map((tier) => (
              <button
                key={tier.value}
                onClick={() => setMonthlyVolume(tier.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  monthlyVolume === tier.value
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Savings Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {PRICING_TIERS.map((tier) => {
          const savings = calculateSavings(tier.inputRate);
          return (
            <div
              key={tier.id}
              className={`rounded-xl bg-gradient-to-b from-[#131927] to-[#0c101a] border ${tier.bg} p-4 relative overflow-hidden group hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">
                  {tier.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  ${tier.inputRate.toFixed(2)}/1M
                </span>
              </div>

              <div className="mt-3">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Annual Savings
                </div>
                <div className={`text-2xl font-extrabold font-mono mt-0.5 ${tier.color}`}>
                  ${savings.annualSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Monthly:</span>
                <span className="text-slate-200 font-semibold">
                  ${savings.monthlySaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Token scale summary */}
      <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Aggregate Token Reduction at scale:
        </span>
        <span className="text-sky-300 font-semibold">
          {(totalTokensSavedAnnual / 1000000.0).toFixed(2)}M tokens eliminated / year
        </span>
      </div>

    </div>
  );
}
