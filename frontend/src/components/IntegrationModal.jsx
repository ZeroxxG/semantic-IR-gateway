import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Code, 
  Terminal, 
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function IntegrationModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonSnippet = `from openai import OpenAI

# Initialize standard OpenAI client with ContextFlow proxy
client = OpenAI(
    base_url="http://localhost:8000/api/v1",
    api_key="sk-your-openai-key-here"  # Forwarded directly via BYOK
)


# Send verbose prompt as usual — gateway automatically compresses to d-SIR
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user", 
            "content": "Hey! Could you write a Python function filter_events that takes list[dict] with timestamp and value, sorts by timestamp ascending, and filters value > threshold with PEP-484 hints and docstring?"
        }
    ],
    temperature=0.2
)

# Inspect upstream model output
print(response.choices[0].message.content)
`;

  const curlSnippet = `curl -X POST http://localhost:8000/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Write a clean PostgreSQL query to aggregate monthly recurring revenue (MRR) and churn rate grouped by billing plan over the past 12 months. Use CTEs and exclude refunds."
      }
    ],
    "temperature": 0.2
  }'
`;

  const jsSnippet = `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:8000/api/v1",
  apiKey: process.env.OPENAI_API_KEY, // Forwarded directly via BYOK
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "user", content: "Design a REST API schema in JSON for inventory management with idempotency keys and stock TTL." }
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();
`;

  const currentCode = activeTab === 'python' ? pythonSnippet : (activeTab === 'curl' ? curlSnippet : jsSnippet);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-canvas border border-hairline rounded-xl shadow-claude-dark max-w-3xl w-full overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-canvas border border-hairline flex items-center justify-center text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-serif text-ink font-normal tracking-tight">
                Integrate ContextFlow Drop-In Proxy
              </h3>
              <p className="text-xs text-muted">
                Replace your OpenAI <code className="text-body font-mono text-[11px] bg-canvas px-1.5 py-0.5 rounded border border-hairline">base_url</code> to achieve instant 60–75% token cost reduction with BYOK.
              </p>

            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink hover:bg-canvas rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-hairline bg-canvas">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'python'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-body hover:text-ink hover:bg-surface-card'
              }`}
            >
              Python (OpenAI SDK)
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'curl'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-body hover:text-ink hover:bg-surface-card'
              }`}
            >
              cURL (HTTP POST)
            </button>
            <button
              onClick={() => setActiveTab('js')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'js'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-body hover:text-ink hover:bg-surface-card'
              }`}
            >
              Node.js / TypeScript
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md bg-surface-card border border-hairline text-body hover:text-ink hover:bg-surface-cream-strong transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-semantic-success" />
                <span className="text-semantic-success font-semibold">Copied snippet</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 bg-surface-dark overflow-auto max-h-[380px] dark-scroll">
          <pre className="text-xs font-mono text-on-dark leading-relaxed whitespace-pre selection:bg-primary/20">
            {currentCode}
          </pre>
        </div>

        {/* Modal Footer Callout */}
        <div className="px-6 py-4 border-t border-hairline bg-surface-card flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-teal" />
            <span>Telemetry headers returned in response: <code className="font-mono text-[11px] text-body">x-sir-tokens-saved</code> & <code className="font-mono text-[11px] text-body">x-sir-savings-usd</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-canvas border border-hairline text-body hover:text-ink hover:bg-surface-soft font-medium transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
