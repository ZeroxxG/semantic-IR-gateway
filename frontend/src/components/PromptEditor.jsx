import React from 'react';
import { 
  FileText, 
  Trash2, 
  Wand2,
  BookOpen
} from 'lucide-react';

const SAMPLE_PROMPTS = [
  {
    title: "Python Data Filter",
    prompt: "Hey there! I really need some help writing a clean Python function. So basically what I am trying to do is, I have this large list of dictionaries where each dictionary represents an event with a 'timestamp' key (which is a Unix epoch integer) and a float 'value' key. I need a function called filter_events that takes this list, sorts it by timestamp in ascending order, and then filters it so it only returns entries where the value is strictly greater than a threshold parameter that the caller passes in. Please make sure to add standard PEP-484 type hints and a descriptive docstring explaining the parameters. Thanks so much!"
  },
  {
    title: "SQL Metric Aggregation",
    prompt: "Hi! Could you please write a PostgreSQL SQL query for my team's analytics database? We need to calculate the monthly recurring revenue (MRR) and user churn rate grouped by billing subscription plan for the past 12 months. Please make sure to exclude refunded transactions, use common table expressions (CTEs) for readability, and format the output columns with clear aliases. Avoid full table scans by filtering on indexed created_at timestamps. Thank you!"
  },
  {
    title: "Contract Liability Clause",
    prompt: "Please carefully review and summarize the indemnification and limitation of liability clauses from the vendor agreement. We need a clear, risk-scored breakdown of mutual obligations, carve-outs for gross negligence or willful misconduct, and the aggregate liability cap (e.g. 12x monthly fees). Present the findings as a structured executive summary with high-risk red flags highlighted."
  },
  {
    title: "REST API Schema",
    prompt: "Hello assistant! I want you to design a production-ready REST API schema in JSON format for an enterprise e-commerce inventory management microservice. It must support idempotency keys for checkout orders, stock reservation with a 15-minute TTL, webhook event dispatching for out-of-stock items, and rate limiting headers (X-RateLimit-Remaining). Please provide exact endpoint paths, HTTP verbs, and JSON request/response payloads."
  }
];

export default function PromptEditor({
  rawPrompt,
  setRawPrompt,
  onCompress,
  isLoading,
  estimatedTokens
}) {
  return (
    <div className="flex flex-col h-full bg-surface-dark border border-surface-dark-elevated rounded-lg overflow-hidden shadow-claude-dark">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-dark-elevated bg-surface-dark">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-surface-dark-elevated flex items-center justify-center text-on-dark-soft">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-on-dark font-sans">
              Raw Verbose Prompt
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-pill bg-surface-dark-elevated text-xs font-mono text-on-dark-soft font-medium">
            {estimatedTokens} tokens
          </div>
          {rawPrompt && (
            <button
              onClick={() => setRawPrompt('')}
              className="p-1.5 text-on-dark-soft hover:text-semantic-error hover:bg-surface-dark-elevated rounded-md transition-colors"
              title="Clear Prompt"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="px-6 py-2.5 bg-surface-dark-soft border-b border-surface-dark-elevated flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-medium text-on-dark-soft uppercase tracking-wider whitespace-nowrap flex items-center gap-1 font-mono">
          <BookOpen className="w-3 h-3 text-primary" />
          Presets:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setRawPrompt(sample.prompt)}
              className="px-2.5 py-1 text-xs rounded-sm bg-surface-dark-elevated hover:bg-[#322f2b] text-on-dark-soft hover:text-on-dark transition-all whitespace-nowrap flex items-center gap-1.5 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative flex-1 p-6 flex flex-col min-h-[300px] bg-surface-dark-soft">
        <textarea
          value={rawPrompt}
          onChange={(e) => setRawPrompt(e.target.value)}
          placeholder="Paste or type your verbose prompt here with full explanations, constraints, and instructions..."
          className="w-full flex-1 bg-transparent text-on-dark text-xs font-mono leading-relaxed placeholder:text-on-dark-soft/50 focus:outline-none resize-none dark-scroll"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="px-6 py-4 border-t border-surface-dark-elevated bg-surface-dark flex items-center justify-between">
        <div className="text-xs text-on-dark-soft font-mono">
          Compiles to d-SIR schema
        </div>
        <button
          onClick={onCompress}
          disabled={isLoading || !rawPrompt.trim()}
          className="h-10 px-5 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-medium tracking-normal shadow-sm disabled:bg-primary-disabled disabled:text-muted disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Compiling d-SIR...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>Compile to d-SIR</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
