import React, { useState } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  Clock, 
  Cpu, 
  ChevronDown, 
  ChevronUp
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
    <div className="bg-surface-dark border border-surface-dark-elevated rounded-lg overflow-hidden shadow-claude-dark mt-6">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface-dark border-b border-surface-dark-elevated">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-surface-dark-elevated flex items-center justify-center text-primary">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-on-dark flex items-center gap-2 font-sans">
              Downstream Model Execution Output
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-pill bg-surface-dark-elevated text-on-dark-soft">
                {targetModel}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {executionData?.inference_latency_ms && (
            <div className="flex items-center gap-1.5 text-xs text-on-dark-soft bg-surface-dark-elevated px-2.5 py-1 rounded-pill font-mono">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{Math.round(executionData.inference_latency_ms)}ms</span>
            </div>
          )}

          {executionData?.executor_engine && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-dark-soft bg-surface-dark-elevated px-2.5 py-1 rounded-pill font-mono">
              <Cpu className="w-3.5 h-3.5 text-on-dark-soft" />
              <span>{executionData.executor_engine}</span>
            </div>
          )}

          {executionData?.llm_response && (
            <button
              onClick={handleCopy}
              className="p-1.5 text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated rounded-md transition-colors"
              title="Copy Output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-semantic-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated rounded-md transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Response Body */}
      {isExpanded && (
        <div className="p-6 bg-surface-dark-soft max-h-[500px] overflow-y-auto dark-scroll">
          {isExecuting ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-dark-soft">
              <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-on-dark">
                Dispatching SIR to target frontier model...
              </p>
              <p className="text-xs text-on-dark-soft mt-1 font-mono">
                Parsing structured schema and verifying execution fidelity
              </p>
            </div>
          ) : (
            <div className="text-xs leading-relaxed font-mono text-on-dark whitespace-pre-wrap selection:bg-primary/20">
              {executionData?.llm_response}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
