import React, { useState, useEffect } from 'react';
import { 
  compressPrompt, 
  executeSIR, 
  getHistory, 
  getPricing, 
  getSystemHealth 
} from './services/api';

import Header from './components/Header';
import MetricCards from './components/MetricCards';
import PromptEditor from './components/PromptEditor';
import SIRViewer from './components/SIRViewer';
import ExecutePanel from './components/ExecutePanel';
import ScaleSimulator from './components/ScaleSimulator';
import HistoryChart from './components/HistoryChart';

import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Layers
} from 'lucide-react';

export default function App() {
  // Global states
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [selectedEngine, setSelectedEngine] = useState('auto');
  const [localMode, setLocalMode] = useState(false);

  // Prompt and SIR states
  const [rawPrompt, setRawPrompt] = useState(
    "Hey there! I really need some help writing a clean Python function. So basically what I am trying to do is, I have this large list of dictionaries where each dictionary represents an event with a 'timestamp' key (which is a Unix epoch integer) and a float 'value' key. I need a function called filter_events that takes this list, sorts it by timestamp in ascending order, and then filters it so it only returns entries where the value is strictly greater than a threshold parameter that the caller passes in. Please make sure to add standard PEP-484 type hints and a descriptive docstring explaining the parameters. Thanks so much!"
  );
  const [sirYaml, setSirYaml] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [costMetrics, setCostMetrics] = useState(null);
  const [fidelityData, setFidelityData] = useState(null);

  // Execution states
  const [executionData, setExecutionData] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // System & History data
  const [historyData, setHistoryData] = useState(null);
  const [pricingData, setPricingData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Client-side instant token estimator
  const estimatedTokens = Math.max(0, Math.round((rawPrompt.trim().length || 0) / 3.8));
  const sirTokens = costMetrics?.sir_tokens || (sirYaml ? Math.round(sirYaml.length / 3.8) : 0);
  const reductionPct = costMetrics?.token_reduction_pct || 0;

  // Show Toast
  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial history, pricing and health
  const refreshHistory = async () => {
    try {
      const data = await getHistory(50);
      setHistoryData(data);
    } catch (err) {
      console.warn('History fetch error:', err);
    }
  };

  useEffect(() => {
    refreshHistory();
    getPricing().then(setPricingData).catch(console.warn);
    getSystemHealth().then(setHealthData).catch(console.warn);
  }, []);

  // Handle Prompt Compression
  const handleCompress = async () => {
    if (!rawPrompt.trim()) {
      showToast('Please enter a prompt to compress.', 'error');
      return;
    }

    setIsCompressing(true);
    setExecutionData(null);

    try {
      const result = await compressPrompt(rawPrompt, selectedModel, selectedEngine);
      setSessionData(result.session);
      setSessionId(result.session.id);
      setSirYaml(result.session.sir_yaml);
      setCostMetrics(result.cost_metrics);
      setFidelityData(result.fidelity);

      showToast(`Compiled d-SIR! Saved ${result.cost_metrics.token_reduction_pct}% tokens.`, 'success');
      refreshHistory();
    } catch (error) {
      console.error('Compression failed:', error);
      showToast(error.response?.data?.detail || 'Compression failed. Check backend connection.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle Downstream Execution
  const handleExecute = async () => {
    if (!sessionId || !sirYaml) {
      showToast('Please compile a prompt to d-SIR first.', 'error');
      return;
    }

    setIsExecuting(true);
    try {
      const result = await executeSIR(sessionId, sirYaml, selectedModel);
      setExecutionData(result);
      showToast(`Execution finished in ${Math.round(result.inference_latency_ms)}ms`, 'success');
      refreshHistory();
    } catch (error) {
      console.error('Execution failed:', error);
      showToast('Execution failed. Check backend logs.', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Load a historical session into view
  const handleSelectSession = (s) => {
    setSessionId(s.id);
    setSessionData(s);
    setRawPrompt(s.raw_prompt);
    setSirYaml(s.sir_yaml);
    setSelectedModel(s.target_model);
    setCostMetrics({
      raw_tokens: s.raw_token_count,
      sir_tokens: s.sir_token_count,
      tokens_saved: s.tokens_saved,
      token_reduction_pct: s.token_reduction_pct,
      cost_saved_usd: s.cost_log?.cost_saved_usd || 0
    });
    setFidelityData({
      score: s.fidelity_score,
      score_pct: Math.round(s.fidelity_score * 1000) / 10,
      passed: s.fidelity_passed
    });
    if (s.llm_response) {
      setExecutionData({
        llm_response: s.llm_response,
        inference_latency_ms: s.inference_latency_ms,
        executor_engine: s.compression_engine
      });
    }
    showToast(`Loaded session ${s.id.slice(0, 8)}`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Radial Background Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-sky-500/10 via-purple-500/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-2/3 -right-40 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <Header
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        selectedEngine={selectedEngine}
        setSelectedEngine={setSelectedEngine}
        healthData={healthData}
        localMode={localMode}
        setLocalMode={setLocalMode}
        currentEngineUsed={sessionData?.compression_engine}
      />

      {/* Main Workspace (Bento Grid) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border backdrop-blur-xl transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              : 'bg-sky-950/90 text-sky-200 border-sky-800'
          }`}>
            {toastMessage.type === 'error' ? <XCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Fidelity Warning Banner */}
        {fidelityData && !fidelityData.passed && (
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 flex items-start gap-3 shadow-xl backdrop-blur-md">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Semantic Fidelity Warning: {fidelityData.score_pct}% (Threshold: 85%)
              </h4>
              <p className="text-xs text-amber-200/80 mt-0.5">
                The compiled d-SIR cosine similarity is lower than standard fidelity. Key constraints might need manual review before dispatching.
              </p>
            </div>
          </div>
        )}

        {/* Bento Row 1: KPI Metric Cards */}
        <MetricCards
          sessionData={sessionData}
          costMetrics={costMetrics}
          fidelityData={fidelityData}
        />

        {/* Bento Row 2: Dual Pane Prompt & d-SIR Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[460px]">
          
          {/* Left: Raw Prompt Editor */}
          <PromptEditor
            rawPrompt={rawPrompt}
            setRawPrompt={setRawPrompt}
            onCompress={handleCompress}
            isLoading={isCompressing}
            estimatedTokens={estimatedTokens}
          />

          {/* Right: Compiled d-SIR Viewer */}
          <SIRViewer
            sirYaml={sirYaml}
            setSirYaml={setSirYaml}
            sirTokens={sirTokens}
            engineUsed={sessionData?.compression_engine}
            reductionPct={reductionPct}
            onExecute={handleExecute}
            isExecuting={isExecuting}
            sessionId={sessionId}
          />

        </div>

        {/* Bento Row 3: Execution Output Panel */}
        <ExecutePanel
          executionData={executionData}
          isExecuting={isExecuting}
          targetModel={selectedModel}
        />

        {/* Bento Row 4: Enterprise Scale Financial Simulator */}
        <ScaleSimulator
          tokensSavedPerReq={costMetrics?.tokens_saved || 115}
          tokenReductionPct={reductionPct || 69.3}
        />

        {/* Bento Row 5: Optimization History & Token Analytics Chart */}
        <HistoryChart
          historyData={historyData}
          onRefresh={refreshHistory}
          onSelectSession={handleSelectSession}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-[#0a0d14]/90 py-5 mt-12 text-center text-xs text-slate-500 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-400 font-mono">Semantic Intermediate Representation (d-SIR)</span>
          </div>
          <div className="font-mono text-[11px]">
            Zero-Cost Cloud Tier & Resilient Offline Fallback
          </div>
        </div>
      </footer>

    </div>
  );
}
