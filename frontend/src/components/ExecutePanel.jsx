import React, { useState } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  Clock, 
  Cpu, 
  ChevronDown, 
  ChevronUp,
  Key,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  DollarSign,
  TrendingDown
} from 'lucide-react';

export default function ExecutePanel({
  executionData,
  isExecuting,
  targetModel,
  openaiApiKey,
  setOpenaiApiKey,
  onExecuteProxy,
  isProxyExecuting,
  proxyTelemetry
}) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showKey, setShowKey] = useState(false);

  const handleCopy = () => {
    if (!executionData?.llm_response) return;
    navigator.clipboard.writeText(executionData.llm_response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface-dark border border-surface-dark-elevated rounded-lg overflow-hidden shadow-claude-dark mt-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-surface-dark border-b border-surface-dark-elevated gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-surface-dark-elevated flex items-center justify-center text-primary">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-on-dark flex items-center gap-2 font-sans">
              Downstream Model Execution & BYOK Proxy
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

      {/* BYOK Key & Proxy Execution Bar */}
      <div className="px-6 py-3 bg-surface-dark-elevated border-b border-surface-dark-elevated flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <Key className="w-4 h-4 text-accent-amber flex-shrink-0" />
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="Optional: Enter your OpenAI API Key (sk-...) for direct BYOK Proxy testing"
              className="w-full bg-surface-dark text-xs font-mono text-on-dark px-3 py-1.5 pr-8 rounded-md border border-[#383530] placeholder:text-on-dark-soft/40 focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-2 text-on-dark-soft hover:text-on-dark"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <button
          onClick={onExecuteProxy}
          disabled={isProxyExecuting || isExecuting}
          className="h-8 px-4 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-medium flex items-center gap-1.5 shadow-claude-subtle transition-all disabled:opacity-40"
          title="Dispatch request through OpenAI Drop-in Proxy route"
        >
          {isProxyExecuting ? (
            <>
              <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Testing Proxy...</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3" />
              <span>Test OpenAI Proxy Route</span>
            </>
          )}
        </button>
      </div>

      {/* Proxy Telemetry Header Strip if available */}
      {proxyTelemetry && (
        <div className="px-6 py-2 bg-surface-dark-soft border-b border-surface-dark-elevated flex flex-wrap items-center gap-4 text-xs font-mono">
          <span className="text-on-dark-soft flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-teal" />
            Proxy Telemetry:
          </span>
          <span className="text-primary font-semibold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Tokens Saved: {proxyTelemetry.tokensSaved} ({proxyTelemetry.reductionPct})
          </span>
          <span className="text-semantic-success font-semibold flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Cost Saved: ${proxyTelemetry.costSavedUsd}
          </span>
          <span className="text-on-dark-soft">
            Status: <code className="text-on-dark font-medium">{proxyTelemetry.status}</code>
          </span>
        </div>
      )}

      {/* Response Body */}
      {isExpanded && (
        <div className="p-6 bg-surface-dark-soft min-h-[140px] max-h-[500px] overflow-y-auto dark-scroll">
          {isExecuting || isProxyExecuting ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-dark-soft">
              <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-on-dark">
                {isProxyExecuting ? 'Dispatching request through OpenAI Drop-in Proxy...' : 'Executing d-SIR on target model...'}
              </p>
              <p className="text-xs text-on-dark-soft mt-1 font-mono">
                Preserving exact semantic fidelity with optimized context payload
              </p>
            </div>
          ) : executionData?.llm_response ? (
            <div className="text-xs leading-relaxed font-mono text-on-dark whitespace-pre-wrap selection:bg-primary/20">
              {executionData.llm_response}
            </div>
          ) : (
            <div className="py-8 text-center text-on-dark-soft text-xs font-mono">
              Ready for downstream execution. Compile a prompt above or click "Test OpenAI Proxy Route".
            </div>
          )}
        </div>
      )}

    </div>
  );
}
