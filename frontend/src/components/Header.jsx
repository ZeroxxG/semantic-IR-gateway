import React from 'react';
import { 
  Layers, 
  Cpu, 
  Sparkles, 
  Sliders, 
  Zap,
  Radio
} from 'lucide-react';

export default function Header({
  selectedModel,
  setSelectedModel,
  selectedEngine,
  setSelectedEngine,
  healthData,
  localMode,
  setLocalMode,
  currentEngineUsed,
}) {
  const isCloudActive = currentEngineUsed?.includes('Cloud') || currentEngineUsed?.includes('Gemini') || currentEngineUsed?.includes('Groq') || healthData?.engines?.gemini?.configured || healthData?.engines?.groq?.configured;
  
  const displayEngine = currentEngineUsed || (healthData?.engines?.gemini?.configured ? 'Gemini 1.5 Flash (Cloud Active)' : 'Offline Fallback (Add Key in .env)');

  return (
    <header className="border-b border-slate-800/80 bg-[#0a0d14]/90 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                SIR Gateway
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono font-semibold">
                  d-SIR v1.0
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">
              Context & Cost Optimization Middleware
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center flex-wrap gap-2.5">
          
          {/* Target Model Selector */}
          <div className="flex items-center gap-1.5 bg-[#111622] border border-slate-800/80 rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Target:
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs font-semibold text-sky-300 focus:outline-none cursor-pointer"
            >
              <option value="gpt-4o" className="bg-[#111622] text-white">GPT-4o ($2.50/1M)</option>
              <option value="claude-3.5-sonnet" className="bg-[#111622] text-white">Claude 3.5 Sonnet ($3.00/1M)</option>
              <option value="gemini-1.5-pro" className="bg-[#111622] text-white">Gemini 1.5 Pro ($1.25/1M)</option>
              <option value="gemini-1.5-flash" className="bg-[#111622] text-white">Gemini 1.5 Flash ($0.075/1M)</option>
            </select>
          </div>

          {/* Compiler Engine Selector */}
          <div className="flex items-center gap-1.5 bg-[#111622] border border-slate-800/80 rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Compiler:
            </span>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="bg-transparent text-xs font-semibold text-purple-300 focus:outline-none cursor-pointer"
            >
              <option value="auto" className="bg-[#111622] text-white">Auto (Gemini Flash → Fallback)</option>
              <option value="gemini" className="bg-[#111622] text-white">Gemini 1.5 Flash (Google AI)</option>
              <option value="groq" className="bg-[#111622] text-white">Groq Llama-3.3 (Fast Cloud)</option>
              {localMode && (
                <option value="ollama" className="bg-[#111622] text-white">Ollama Local (llama3.2)</option>
              )}
            </select>
          </div>

          {/* Advanced / Local Mode Toggle */}
          <button
            onClick={() => setLocalMode(!localMode)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
              localMode
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-[#111622] border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Developer Local Mode"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="font-medium">Local</span>
          </button>

          {/* Active Engine Indicator with Ping Dot */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs ${
            isCloudActive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCloudActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isCloudActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </span>
            <span className="font-semibold">{displayEngine}</span>
          </div>

        </div>

      </div>
    </header>
  );
}
