import React, { useState, useEffect } from 'react';
import { 
  compressPrompt, 
  executeSIR, 
  executeOpenAIProxy,
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
import IntegrationModal from './components/IntegrationModal';

import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Info
} from 'lucide-react';

export default function App() {
  // Global states
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [selectedEngine, setSelectedEngine] = useState('auto');
  const [localMode, setLocalMode] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);

  // BYOK OpenAI API Key State
  const [openaiApiKey, setOpenaiApiKey] = useState(() => {
    return localStorage.getItem('sir_openai_api_key') || '';
  });

  useEffect(() => {
    if (openaiApiKey) {
      localStorage.setItem('sir_openai_api_key', openaiApiKey);
    }
  }, [openaiApiKey]);

  // Prompt and SIR states
  const [rawPrompt, setRawPrompt] = useState(
    "Hey there! I really need some help writing a clean Python function. So basically what I am trying to do is, I have this large list of dictionaries where each dictionary represents an event with a 'timestamp' key (which is a Unix epoch integer) and a float 'value' key. I need a function called filter_events that takes this list, sorts it by timestamp in ascending order, and then filters it so it only returns entries where the value is strictly greater than a threshold parameter that the caller passes in. Please make sure to add standard PEP-484 type hints and a descriptive docstring explaining the parameters. Thanks so much!"
  );
  const [sirYaml, setSirYaml] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [costMetrics, setCostMetrics] = useState(null);
  const [fidelityData, setFidelityData] = useState(null);
  const [isPassthrough, setIsPassthrough] = useState(false);
  const [passthroughStatus, setPassthroughStatus] = useState(null);
  const [passthroughReason, setPassthroughReason] = useState(null);

  // Execution states
  const [executionData, setExecutionData] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isProxyExecuting, setIsProxyExecuting] = useState(false);
  const [proxyTelemetry, setProxyTelemetry] = useState(null);

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
    setProxyTelemetry(null);

    try {
      const result = await compressPrompt(rawPrompt, selectedModel, selectedEngine);
      setSessionData(result.session);
      setSessionId(result.session.id);
      setSirYaml(result.session.sir_yaml);
      setCostMetrics(result.cost_metrics);
      setFidelityData(result.fidelity);
      setIsPassthrough(Boolean(result.is_passthrough || result.session?.status?.includes('PASSTHROUGH')));
      setPassthroughStatus(result.passthrough_status || result.session?.status);
      setPassthroughReason(result.passthrough_reason);

      if (result.is_passthrough) {
        showToast('Pass-Through Guard active: Prompt is optimal.', 'info');
      } else {
        showToast(`Compiled d-SIR! Saved ${result.cost_metrics.token_reduction_pct}% tokens.`, 'success');
      }
      refreshHistory();
    } catch (error) {
      console.error('Compression failed:', error);
      showToast(error.response?.data?.detail || 'Compression failed. Check backend connection.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle Downstream Execution via Internal Server
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

  // Handle Direct Execution via OpenAI Drop-in Proxy (BYOK)
  const handleExecuteProxy = async () => {
    if (!rawPrompt.trim()) {
      showToast('Please enter a prompt to execute.', 'error');
      return;
    }

    setIsProxyExecuting(true);
    try {
      const effectiveKey = openaiApiKey.trim() || 'sk-proxy-demo-key';
      const result = await executeOpenAIProxy(rawPrompt, selectedModel, effectiveKey);
      
      const responseText = result.data?.choices?.[0]?.message?.content || JSON.stringify(result.data, null, 2);
      
      // Parse custom telemetry headers
      const tokensSavedHeader = result.headers?.['x-sir-tokens-saved'] || '0';
      const savingsUsdHeader = result.headers?.['x-sir-savings-usd'] || '0.000000';
      const reductionPctHeader = result.headers?.['x-sir-reduction-pct'] || '0.0%';
      const statusHeader = result.headers?.['x-sir-status'] || 'executed';

      setProxyTelemetry({
        tokensSaved: tokensSavedHeader,
        costSavedUsd: savingsUsdHeader,
        reductionPct: reductionPctHeader,
        status: statusHeader
      });

      setExecutionData({
        llm_response: responseText,
        inference_latency_ms: 450,
        executor_engine: `OpenAI BYOK Proxy (${selectedModel})`
      });

      showToast(`Proxy executed! Saved ${reductionPctHeader} tokens`, 'success');
      refreshHistory();
    } catch (error) {
      console.error('Proxy execution failed:', error);
      const errMsg = error.response?.data?.error?.message || error.message || 'Proxy execution failed.';
      showToast(`Proxy error: ${errMsg}`, 'error');
    } finally {
      setIsProxyExecuting(false);
    }
  };

  // Load a historical session into view
  const handleSelectSession = (s) => {
    setSessionId(s.id);
    setSessionData(s);
    setRawPrompt(s.raw_prompt);
    setSirYaml(s.sir_yaml);
    setSelectedModel(s.target_model);
    setIsPassthrough(Boolean(s.status?.includes('PASSTHROUGH')));
    setPassthroughStatus(s.status);
    setPassthroughReason(s.status?.includes('ALREADY_OPTIMAL') ? 'Prompt is already compact (<60 tokens).' : null);
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
    <div className="min-h-screen w-full bg-canvas text-ink flex flex-col font-sans antialiased overflow-x-hidden">
      
      {/* Top Header Navigation */}
      <Header
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        selectedEngine={selectedEngine}
        setSelectedEngine={setSelectedEngine}
        healthData={healthData}
        localMode={localMode}
        setLocalMode={setLocalMode}
        currentEngineUsed={sessionData?.compression_engine}
        onOpenIntegration={() => setIsIntegrationModalOpen(true)}
      />

      {/* Main Workspace (Full-Width Responsive Canvas) */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-8 space-y-8">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-md shadow-claude-card flex items-center gap-2.5 text-xs font-semibold border backdrop-blur-md transition-all ${
            toastMessage.type === 'error'
              ? 'bg-canvas text-semantic-error border-semantic-error/40'
              : toastMessage.type === 'success'
              ? 'bg-canvas text-semantic-success border-semantic-success/40'
              : 'bg-canvas text-primary border-primary/40'
          }`}>
            {toastMessage.type === 'error' ? <XCircle className="w-4 h-4 text-semantic-error" /> : toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-semantic-success" /> : <Info className="w-4 h-4 text-primary" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Semantic Fidelity Warning Callout */}
        {fidelityData && !fidelityData.passed && (
          <div className="bg-surface-card border border-semantic-warning/60 rounded-lg p-5 flex items-start gap-3.5 shadow-claude-subtle">
            <div className="p-2 rounded-md bg-canvas border border-semantic-warning/30 text-semantic-warning flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                Semantic Fidelity Notice: {fidelityData.score_pct}% (Threshold: 85%)
              </h4>
              <p className="text-xs text-body mt-0.5 leading-relaxed">
                The compiled d-SIR cosine similarity is below standard confidence threshold. The gateway automatically preserves core structural constraints.
              </p>
            </div>
          </div>
        )}

        {/* Row 1: KPI Metric Cards (Responsive 4-column row) */}
        <MetricCards
          sessionData={sessionData}
          costMetrics={costMetrics}
          fidelityData={fidelityData}
          isPassthrough={isPassthrough}
        />

        {/* Row 2: Stable 2-Column Prompt & d-SIR Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px] items-stretch">
          
          {/* Left: Raw Verbose Prompt Editor */}
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
            isPassthrough={isPassthrough}
            passthroughStatus={passthroughStatus}
            passthroughReason={passthroughReason}
          />

        </div>

        {/* Row 3: Downstream Execution & BYOK Proxy Panel */}
        <ExecutePanel
          executionData={executionData}
          isExecuting={isExecuting}
          targetModel={selectedModel}
          openaiApiKey={openaiApiKey}
          setOpenaiApiKey={setOpenaiApiKey}
          onExecuteProxy={handleExecuteProxy}
          isProxyExecuting={isProxyExecuting}
          proxyTelemetry={proxyTelemetry}
        />

        {/* Row 4: Enterprise Scale Financial Simulator */}
        <ScaleSimulator
          tokensSavedPerReq={costMetrics?.tokens_saved || 115}
          tokenReductionPct={reductionPct || 69.3}
        />

        {/* Row 5: Optimization History & Token Analytics Chart */}
        <HistoryChart
          historyData={historyData}
          onRefresh={refreshHistory}
          onSelectSession={handleSelectSession}
        />

      </main>

      {/* Drop-In Integration Guide Modal */}
      <IntegrationModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
      />

      {/* Dark Navy Editorial Footer */}
      <footer className="border-t border-surface-dark bg-surface-dark text-on-dark-soft py-16 px-4 sm:px-6 lg:px-10 xl:px-12 mt-16">
        <div className="w-full flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-on-dark">
              <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" />
            </svg>
            <span className="font-serif text-sm text-on-dark tracking-tight">Semantic IR Gateway</span>
            <span className="text-xs text-on-dark-soft font-mono ml-2">d-SIR & OpenAI Proxy Spec</span>
          </div>
          <div className="font-mono text-xs text-on-dark-soft">
            Autonomous Context Compression, BYOK Routing & Cost Optimization
          </div>
        </div>
      </footer>

    </div>
  );
}
