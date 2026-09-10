import React from 'react';
import { 
  Layers, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Zap,
  Activity
} from 'lucide-react';

export default function Header({
  selectedModel,
  setSelectedModel,
  selectedEngine,
  setSelectedEngine,
  pricingData,
  healthData,
  localMode,
  setLocalMode,
}) {
  return (
    <header className="border-b border-slate-800 bg-[#0c1019]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-[#0c1019] rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SIR Gateway
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono font-medium">
                  v1.0
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Semantic Intermediate Representation • Context & Cost Optimization
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Target Model Selector */}
          <div className="flex items-center gap-2 bg-[#121826] border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Target LLM:
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs font-semibold text-sky-300 focus:outline-none cursor-pointer"
            >
              <option value="gpt-4o" className="bg-[#121826] text-white">GPT-4o ($2.50/1M)</option>
              <option value="claude-3.5-sonnet" className="bg-[#121826] text-white">Claude 3.5 Sonnet ($3.00/1M)</option>
              <option value="gemini-1.5-pro" className="bg-[#121826] text-white">Gemini 1.5 Pro ($1.25/1M)</option>
              <option value="gemini-1.5-flash" className="bg-[#121826] text-white">Gemini 1.5 Flash ($0.075/1M)</option>
            </select>
          </div>

          {/* Compression Engine Selector */}
          <div className="flex items-center gap-2 bg-[#121826] border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Compiler Engine:
            </span>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="bg-transparent text-xs font-semibold text-purple-300 focus:outline-none cursor-pointer"
            >
              <option value="auto" className="bg-[#121826] text-white">Auto (Gemini Flash → Fallback)</option>
              <option value="gemini" className="bg-[#121826] text-white">Gemini 1.5 Flash (Google AI)</option>
              <option value="groq" className="bg-[#121826] text-white">Groq Llama-3.3 (Fast Cloud)</option>
              {localMode && (
                <option value="ollama" className="bg-[#121826] text-white">Ollama Local (llama3.2)</option>
              )}
            </select>
          </div>

          {/* Advanced / Local Mode Toggle */}
          <button
            onClick={() => setLocalMode(!localMode)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              localMode
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-[#121826] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Developer & Local Ollama Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="font-medium">Local Mode</span>
          </button>

          {/* Engine Status Indicator */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono font-medium">Gateway Active</span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
