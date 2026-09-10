import React, { useState } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  Clock, 
  Cpu, 
  ChevronDown, 
  ChevronUp,
  Terminal
} from 'lucide-react';

export default function ExecutePanel({
  executionData,
  isExecuting,
  targetModel
}) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!executionData && !isExecuting) {
    return null;
  }

  const handleCopy = () => {
    if (!executionData?.llm_response) return;
    navigator.clipboard.writeText(executionData.llm_response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0e131f] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl mt-6">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#121a29] to-[#162033] border-b border-emerald-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Downstream Model Execution Output
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                {targetModel}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {executionData?.inference_latency_ms && (
            <div className="flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md font-mono">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{Math.round(executionData.inference_latency_ms)}ms</span>
            </div>
          )}

          {executionData?.executor_engine && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md font-mono">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>{executionData.executor_engine}</span>
            </div>
          )}

          {executionData?.llm_response && (
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
              title="Copy Output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Response Body */}
      {isExpanded && (
        <div className="p-5 bg-[#0a0d14] max-h-[500px] overflow-y-auto">
          {isExecuting ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-300">
                Dispatching SIR to target frontier model...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Parsing structured schema and verifying execution fidelity
              </p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-xs leading-relaxed font-mono text-slate-200 whitespace-pre-wrap selection:bg-sky-500/20">
              {executionData?.llm_response}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
