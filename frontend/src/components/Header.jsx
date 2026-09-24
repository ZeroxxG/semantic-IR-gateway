import React from 'react';
import { 
  Cpu, 
  Sliders, 
  Zap,
  Code2
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
  onOpenIntegration
}) {
  const isCloudActive = currentEngineUsed?.includes('Cloud') || currentEngineUsed?.includes('Gemini') || currentEngineUsed?.includes('Groq') || healthData?.engines?.gemini?.configured || healthData?.engines?.groq?.configured;
  
  const displayEngine = currentEngineUsed || (healthData?.engines?.gemini?.configured ? 'Gemini 1.5 Flash (Cloud)' : 'Offline Fallback (.env)');

  return (
    <header className="border-b border-hairline bg-canvas/95 backdrop-blur-md sticky top-0 z-50 h-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 h-full flex items-center justify-between gap-4">
        
        {/* Brand with Anthropic 4-Spoke Radial Spike Mark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center text-ink flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-serif text-ink tracking-tight font-normal">
                ContextFlow
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-pill bg-surface-card border border-hairline text-body font-medium">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-muted hidden sm:block">
              Context Compression & Semantic Fidelity Middleware
            </p>
          </div>

        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center flex-wrap gap-2.5">
          
          {/* Target Model Selector */}
          <div className="flex items-center gap-1.5 bg-surface-card border border-hairline rounded-md px-3 h-10 shadow-claude-subtle">
            <span className="text-xs text-muted font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              Target:
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer"
            >
              <option value="gpt-4o">GPT-4o ($2.50/1M)</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet ($3.00/1M)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro ($1.25/1M)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash ($0.075/1M)</option>
            </select>
          </div>

          {/* Compiler Engine Selector */}
          <div className="flex items-center gap-1.5 bg-surface-card border border-hairline rounded-md px-3 h-10 shadow-claude-subtle">
            <span className="text-xs text-muted font-medium flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-accent-amber" />
              Compiler:
            </span>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer"
            >
              <option value="auto">Auto (Gemini Flash → Fallback)</option>
              <option value="gemini">Gemini 1.5 Flash (Google AI)</option>
              <option value="groq">Groq Qwen/Llama (Fast Cloud)</option>
              {localMode && (
                <option value="ollama">Ollama Local (llama3.2)</option>
              )}
            </select>
          </div>

          {/* Integrate into Code Button */}
          <button
            onClick={onOpenIntegration}
            className="flex items-center gap-1.5 text-xs px-3.5 h-10 rounded-md bg-primary hover:bg-primary-active text-on-primary font-medium transition-all shadow-claude-subtle active:scale-[0.98]"
            title="Open drop-in OpenAI SDK integration guide"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Integrate into Code</span>
          </button>

          {/* Advanced / Local Mode Toggle */}
          <button
            onClick={() => setLocalMode(!localMode)}
            className={`flex items-center gap-1.5 text-xs px-3 h-10 rounded-md border transition-all ${
              localMode
                ? 'bg-surface-cream-strong border-body text-ink font-semibold'
                : 'bg-canvas border-hairline text-muted hover:text-ink hover:bg-surface-card'
            }`}
            title="Toggle Developer Local Mode"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Local</span>
          </button>

          {/* Active Engine Indicator Pill */}
          <div className={`flex items-center gap-2 px-3 h-10 rounded-pill border text-xs font-mono font-medium ${
            isCloudActive
              ? 'bg-surface-card border-hairline text-ink'
              : 'bg-surface-card border-hairline text-muted'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isCloudActive ? 'bg-semantic-success' : 'bg-semantic-warning'
            }`} />
            <span className="truncate max-w-[140px] sm:max-w-none">{displayEngine}</span>
          </div>

        </div>

      </div>
    </header>
  );
}
