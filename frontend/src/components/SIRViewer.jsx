import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Edit3, 
  Zap,
  FileCode,
  Sparkles,
  ArrowDownRight
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
  const [viewFormat, setViewFormat] = useState('yaml'); // 'yaml' or 'json'

  const handleCopy = () => {
    const textToCopy = getFormattedContent();
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getFormattedContent();
    if (!content) return;
    const isJson = viewFormat === 'json';
    const blob = new Blob([content], { type: isJson ? 'application/json' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dsir_spec_${sessionId ? sessionId.slice(0, 8) : 'export'}.${isJson ? 'json' : 'yaml'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Convert YAML string to JSON string safely for toggle preview
  const getFormattedContent = () => {
    if (!sirYaml) return '';
    if (viewFormat === 'json') {
      try {
        // Simple client-side YAML to JSON lines converter
        const lines = sirYaml.split('\n');
        const jsonObj = {};
        let currentSection = null;

        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;

          if (line.startsWith('goal:')) {
            jsonObj['goal'] = trimmed.replace('goal:', '').trim().replace(/^['"]|['"]$/g, '');
            currentSection = null;
          } else if (line.startsWith('spec:')) {
            jsonObj['spec'] = {};
            currentSection = 'spec';
          } else if (currentSection === 'spec' && line.startsWith('  ')) {
            const [k, ...v] = trimmed.split(':');
            if (k && v) {
              jsonObj.spec[k.trim()] = v.join(':').trim().replace(/^['"]|['"]$/g, '');
            }
          }
        });

        if (Object.keys(jsonObj).length > 0) {
          return JSON.stringify(jsonObj, null, 2);
        }
      } catch (e) {
        console.warn('JSON preview parse error', e);
      }
    }
    return sirYaml;
  };

  const displayContent = getFormattedContent();

  return (
    <div className="flex flex-col h-full bg-[#0d121c]/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl relative group">
      
      {/* Subtle Glow Overlay */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#111622]/80 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Compiled d-SIR
              {engineUsed && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                  {engineUsed}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2">
          
          {/* Dynamic Token Reduction Pill in Vibrant Emerald Green */}
          {reductionPct > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-extrabold shadow-sm shadow-emerald-950/50 flex items-center gap-1 animate-pulse">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>-{reductionPct.toFixed(1)}% Token Reduction</span>
            </div>
          )}

          {/* Token Counter Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-xs font-mono text-emerald-300 border border-slate-800 font-semibold">
            {sirTokens} tokens
          </div>

          {/* Format Toggle (YAML / JSON) */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewFormat('yaml')}
              className={`px-2 py-1 text-[11px] font-mono rounded-md font-semibold transition-all ${
                viewFormat === 'yaml'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              YAML
            </button>
            <button
              onClick={() => setViewFormat('json')}
              className={`px-2 py-1 text-[11px] font-mono rounded-md font-semibold transition-all ${
                viewFormat === 'json'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON
            </button>
          </div>
          
          {/* Edit Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={!sirYaml}
            className={`p-1.5 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Edit d-SIR"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!sirYaml}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
            title="Copy Output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!sirYaml}
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors border border-transparent hover:border-sky-500/20"
            title="Download specification"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 p-5 flex flex-col min-h-[260px] overflow-auto bg-[#0a0d14]/70">
        {displayContent ? (
          isEditing && viewFormat === 'yaml' ? (
            <textarea
              value={sirYaml}
              onChange={(e) => setSirYaml(e.target.value)}
              className="w-full flex-1 bg-transparent text-emerald-300 text-xs font-mono placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
            />
          ) : (
            <pre className="text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-emerald-500/20">
              {displayContent}
            </pre>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              No d-SIR Compiled Yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Enter your prompt on the left and click "Compile to d-SIR" to generate an ultra-dense representation under 50 tokens.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-[#111622]/80 flex items-center justify-between">
        <div className="text-xs text-slate-400 font-mono">
          Ultra-dense d-SIR • 0% conversational fluff
        </div>
        <button
          onClick={onExecute}
          disabled={isExecuting || !sirYaml || !sessionId}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 transition-all transform active:scale-95"
        >
          {isExecuting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Executing Target LLM...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>Execute Target LLM</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
