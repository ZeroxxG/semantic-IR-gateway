import React from 'react';
import { 
  FileText, 
  Trash2, 
  Wand2,
  BookOpen,
  Sparkles
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
    title: "REST API Design",
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
    <div className="flex flex-col h-full bg-[#0d121c]/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl relative group">
      
      {/* Subtle Glow Overlay */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#111622]/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Raw Verbose Prompt
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-xs font-mono text-sky-300 border border-slate-800 font-semibold">
            {estimatedTokens} tokens
          </div>
          {rawPrompt && (
            <button
              onClick={() => setRawPrompt('')}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Clear Prompt"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="px-4 py-2 bg-[#090d15] border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 font-mono">
          <BookOpen className="w-3 h-3 text-sky-400" />
          Presets:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setRawPrompt(sample.prompt)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all whitespace-nowrap flex items-center gap-1.5 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative flex-1 p-5 flex flex-col min-h-[260px] bg-[#0a0d14]/70">
        <textarea
          value={rawPrompt}
          onChange={(e) => setRawPrompt(e.target.value)}
          placeholder="Paste or type your verbose prompt here with full explanations, constraints, and instructions..."
          className="w-full flex-1 bg-transparent text-slate-200 text-xs font-sans placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-[#111622]/80 flex items-center justify-between">
        <div className="text-xs text-slate-400 font-mono">
          Compiles to under 50 tokens
        </div>
        <button
          onClick={onCompress}
          disabled={isLoading || !rawPrompt.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 transition-all transform active:scale-95"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
