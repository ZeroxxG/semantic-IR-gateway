import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Edit3, 
  Zap, 
  Sparkles, 
  ArrowDownRight, 
  ShieldCheck, 
  Info,
  AlertTriangle 
} from 'lucide-react';

export default function SIRViewer({
  sirYaml,
  setSirYaml,
  sirTokens,
  engineUsed,
  reductionPct,
  onExecute,
  isExecuting,
  sessionId,
  isPassthrough,
  passthroughStatus,
  passthroughReason
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
    a.download = `payload_${sessionId ? sessionId.slice(0, 8) : 'export'}.${isJson ? 'json' : 'yaml'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Convert YAML string to JSON string safely for toggle preview
  const getFormattedContent = () => {
    if (!sirYaml) return '';
    if (viewFormat === 'json') {
      try {
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
  const isFallback = passthroughStatus?.includes('FALLBACK') || passthroughStatus === 'FALLBACK_FIDELITY_GUARD';

  return (
    <div className="flex flex-col h-full bg-surface-dark border border-surface-dark-elevated rounded-lg overflow-hidden shadow-claude-dark">
      
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-surface-dark-elevated bg-surface-dark gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-surface-dark-elevated flex items-center justify-center text-primary">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-on-dark flex items-center gap-2 font-sans">
              {isFallback ? 'Payload (Fallback Guard)' : isPassthrough ? 'Payload (Pass-Through)' : 'Compiled d-SIR'}
              {engineUsed && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-surface-dark-elevated text-on-dark-soft">
                  {engineUsed}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2">
          
          {/* Status Badges: COMPRESSED, PASSTHROUGH (Optimal), or FALLBACK */}
          {isFallback ? (
            <div className="px-2.5 py-1 rounded-pill bg-surface-dark-elevated text-semantic-warning text-xs font-mono font-medium flex items-center gap-1.5 border border-semantic-warning/30">
              <AlertTriangle className="w-3.5 h-3.5 text-semantic-warning" />
              <span>FALLBACK (Fidelity)</span>
            </div>
          ) : isPassthrough ? (
            <div className="px-2.5 py-1 rounded-pill bg-surface-dark-elevated text-accent-teal text-xs font-mono font-medium flex items-center gap-1.5 border border-surface-dark-elevated">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-teal" />
              <span>PASSTHROUGH (Optimal)</span>
            </div>
          ) : reductionPct > 0 ? (
            <div className="px-2.5 py-1 rounded-pill bg-surface-dark-elevated text-primary text-xs font-mono font-medium flex items-center gap-1 border border-surface-dark-elevated">
              <ArrowDownRight className="w-3.5 h-3.5 text-primary" />
              <span>COMPRESSED (-{reductionPct.toFixed(1)}%)</span>
            </div>
          ) : null}

          {/* Token Counter Badge */}
          <div className="px-2.5 py-1 rounded-pill bg-surface-dark-elevated text-xs font-mono text-on-dark-soft font-medium">
            {sirTokens} tokens
          </div>

          {/* Format Toggle (YAML / JSON) */}
          <div className="flex items-center bg-surface-dark-elevated rounded-md p-0.5">
            <button
              onClick={() => setViewFormat('yaml')}
              className={`px-2 py-0.5 text-[11px] font-mono rounded-sm font-medium transition-all ${
                viewFormat === 'yaml'
                  ? 'bg-surface-dark text-on-dark shadow-xs'
                  : 'text-on-dark-soft hover:text-on-dark'
              }`}
            >
              YAML
            </button>
            <button
              onClick={() => setViewFormat('json')}
              className={`px-2 py-0.5 text-[11px] font-mono rounded-sm font-medium transition-all ${
                viewFormat === 'json'
                  ? 'bg-surface-dark text-on-dark shadow-xs'
                  : 'text-on-dark-soft hover:text-on-dark'
              }`}
            >
              JSON
            </button>
          </div>
          
          {/* Edit Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={!sirYaml}
            className={`p-1.5 rounded-md transition-colors ${
              isEditing 
                ? 'bg-surface-dark-soft text-primary' 
                : 'text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated'
            }`}
            title="Edit Payload"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!sirYaml}
            className="p-1.5 text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated rounded-md transition-colors"
            title="Copy Output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-semantic-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!sirYaml}
            className="p-1.5 text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated rounded-md transition-colors"
            title="Download payload"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pass-Through / Fallback Info Banner */}
      {(isPassthrough || isFallback) && (
        <div className="px-6 py-2.5 bg-surface-dark-elevated border-b border-surface-dark-elevated flex items-center gap-2 text-xs text-on-dark-soft font-mono">
          {isFallback ? (
            <AlertTriangle className="w-4 h-4 text-semantic-warning flex-shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-accent-teal flex-shrink-0" />
          )}
          <span>{passthroughReason || "Anti-Inflation Guard: Original prompt preserved to prevent token expansion."}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative flex-1 p-6 flex flex-col min-h-[300px] overflow-auto bg-surface-dark-soft dark-scroll">
        {displayContent ? (
          isEditing && viewFormat === 'yaml' ? (
            <textarea
              value={sirYaml}
              onChange={(e) => setSirYaml(e.target.value)}
              className="w-full flex-1 bg-transparent text-accent-teal text-xs font-mono placeholder:text-on-dark-soft/50 focus:outline-none resize-none leading-relaxed"
            />
          ) : (
            <pre className="text-xs font-mono text-on-dark leading-relaxed overflow-x-auto whitespace-pre selection:bg-primary/20">
              {displayContent}
            </pre>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-on-dark-soft p-8 text-center">
            <div className="w-10 h-10 rounded-lg bg-surface-dark-elevated flex items-center justify-center mb-3 text-on-dark-soft">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-on-dark">
              No Payload Generated Yet
            </p>
            <p className="text-xs text-on-dark-soft mt-1 max-w-sm">
              Enter your prompt on the left and click "Compile to d-SIR" to optimize context.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="px-6 py-4 border-t border-surface-dark-elevated bg-surface-dark flex items-center justify-between">
        <div className="text-xs text-on-dark-soft font-mono">
          {isFallback ? 'Reverted to raw • 100% fidelity' : isPassthrough ? 'Direct pass-through • 0% inflation' : 'Dense d-SIR schema • Max savings'}
        </div>
        <button
          onClick={onExecute}
          disabled={isExecuting || !sirYaml || !sessionId}
          className="h-10 px-5 rounded-md bg-surface-dark-elevated hover:bg-[#322f2b] text-on-dark border border-[#383530] text-xs font-medium tracking-normal shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          {isExecuting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Executing Target LLM...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Execute Target LLM</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
