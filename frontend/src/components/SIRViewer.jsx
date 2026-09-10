import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Edit3, 
  Cpu, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function SIRViewer({
  sirYaml,
  setSirYaml,
  sirTokens,
  engineUsed,
  reductionPct,
  onExecute,
  isExecuting,
  sessionId
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    if (!sirYaml) return;
    navigator.clipboard.writeText(sirYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!sirYaml) return;
    const blob = new Blob([sirYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sir_spec_${sessionId ? sessionId.slice(0, 8) : 'export'}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#121826]">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            Compiled SIR (YAML)
            {engineUsed && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-normal">
                {engineUsed}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {reductionPct > 0 && (
            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-semibold text-emerald-400">
              -{reductionPct}%
            </div>
          )}
          <div className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-mono text-emerald-300 border border-slate-700">
            Tokens: <span className="font-bold">{sirTokens}</span>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={!sirYaml}
            className={`p-1.5 rounded-md transition-colors ${
              isEditing 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Edit SIR YAML"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            disabled={!sirYaml}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
            title="Copy YAML"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            disabled={!sirYaml}
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-md transition-colors"
            title="Download .yaml"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 p-4 flex flex-col min-h-[260px] overflow-auto bg-[#0a0d14]">
        {sirYaml ? (
          isEditing ? (
            <textarea
              value={sirYaml}
              onChange={(e) => setSirYaml(e.target.value)}
              className="w-full flex-1 bg-transparent text-emerald-300 text-xs font-mono placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
            />
          ) : (
            <pre className="text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-emerald-500/20">
              {sirYaml}
            </pre>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-3 text-slate-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              No SIR Compiled Yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Enter a verbose prompt on the left and click "Compile to SIR" to generate a dense semantic representation.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-[#121826] flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Structured intent schema • High token density
        </div>
        <button
          onClick={onExecute}
          disabled={isExecuting || !sirYaml || !sessionId}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 transition-all transform active:scale-95"
        >
          {isExecuting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Executing Target LLM...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Execute Target LLM</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
