import React, { useState } from 'react';
import { 
  Calculator, 
  Building2, 
  Sparkles
} from 'lucide-react';

const PRICING_TIERS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', inputRate: 2.50, featured: false },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputRate: 3.00, featured: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', inputRate: 1.25, featured: false },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', inputRate: 0.075, featured: false },
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
    <div className="bg-surface-card border border-hairline rounded-lg p-6 sm:p-8 shadow-claude-subtle mt-8">
      
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-hairline">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-canvas border border-hairline flex items-center justify-center text-primary">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-serif text-ink font-normal tracking-tight">
              Enterprise Scale Financial Simulator
            </h3>
            <p className="text-sm text-body mt-0.5">
              Project annual operational dollar savings based on your team's production API volume
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-canvas border border-hairline rounded-md px-3.5 py-2 font-mono text-xs">
          <span className="text-muted">Tokens saved / req:</span>
          <span className="font-semibold text-primary">{effectiveTokensSaved}</span>
          <span className="text-muted-soft">({tokenReductionPct.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Interactive Volume Slider */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-body uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <Building2 className="w-4 h-4 text-primary" />
            Monthly Request Volume:
          </label>
          <span className="text-base font-mono font-semibold text-ink bg-canvas border border-hairline px-3 py-1 rounded-md">
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
          className="w-full h-2 bg-surface-cream-strong rounded-pill appearance-none cursor-pointer accent-[#cc785c]"
        />

        {/* Quick Tiers */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <span className="text-xs text-muted">Quick presets:</span>
          <div className="flex items-center gap-1.5">
            {quickVolumes.map((tier) => (
              <button
                key={tier.value}
                onClick={() => setMonthlyVolume(tier.value)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  monthlyVolume === tier.value
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-canvas border border-hairline text-body hover:text-ink hover:bg-surface-soft'
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
          const isFeatured = tier.featured;

          return (
            <div
              key={tier.id}
              className={`rounded-lg p-5 transition-all flex flex-col justify-between ${
                isFeatured
                  ? 'bg-surface-dark text-on-dark shadow-claude-dark'
                  : 'bg-canvas border border-hairline text-ink shadow-claude-subtle'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isFeatured ? 'text-on-dark' : 'text-ink'}`}>
                    {tier.name}
                  </span>
                  {isFeatured && (
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-pill bg-primary text-on-primary font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <div className={`text-[11px] font-mono ${isFeatured ? 'text-on-dark-soft' : 'text-muted'}`}>
                  ${tier.inputRate.toFixed(2)} / 1M tokens
                </div>

                <div className="mt-5">
                  <div className={`text-[11px] uppercase tracking-wider font-medium ${isFeatured ? 'text-on-dark-soft' : 'text-muted'}`}>
                    Annual Net Savings
                  </div>
                  <div className={`text-2xl font-serif mt-1 font-normal tracking-tight ${isFeatured ? 'text-primary' : 'text-ink'}`}>
                    ${savings.annualSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono ${
                isFeatured ? 'border-surface-dark-elevated text-on-dark-soft' : 'border-hairline-soft text-muted'
              }`}>
                <span>Monthly:</span>
                <span className={`font-semibold ${isFeatured ? 'text-on-dark' : 'text-body-strong'}`}>
                  ${savings.monthlySaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Token scale summary */}
      <div className="mt-6 p-4 rounded-md bg-canvas border border-hairline flex items-center justify-between text-xs text-body font-mono">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Aggregate Token Reduction at scale:
        </span>
        <span className="text-ink font-semibold">
          {(totalTokensSavedAnnual / 1000000.0).toFixed(2)}M tokens eliminated / year
        </span>
      </div>

    </div>
  );
}
