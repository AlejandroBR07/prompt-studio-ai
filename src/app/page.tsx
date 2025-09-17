'use client';

import { useState, ChangeEvent, FC, useEffect } from 'react';
import { N8NFlow, N8NNode } from '@/types/n8n';

// --- Tipos Genéricos ---
type AnalysisSection = {
  title: string;
  score: number;
  feedback: string;
};
type DifyAnalysisResult = {
  overallScore: number;
  sections: AnalysisSection[];
  suggestions: string[];
};

type StressTest = {
  pergunta_capciosa: string;
  resposta_ideal: string;
};



// --- Componente de Ícone (Reutilizado) ---
const NodeIcon: FC<{ icon: string; className?: string }> = ({ icon, className = 'text-4xl' }) => {
  // Normaliza tipos como "n8n-nodes-base.webhook" → "webhook"
  const normalize = (raw: string) => {
    const s = (raw || '').toLowerCase();
    if (s.startsWith('n8n-nodes-base.')) return s.split('.').pop() as string;
    return s;
  };
  const key = normalize(icon);
  const iconMap: Record<string, string> = {
    webhook: '🔗',
    respondtowebhook: '↩️',
    http: '🌐',
    httprequest: '🌐',
    set: '🧩',
    code: '💻',
    if: '🤔',
    switch: '🚦',
    gmail: '📧',
    googlesheets: '📊',
    sheets: '📊',
    googledrive: '📁',
    drive: '📁',
    discord: '💬',
    extractfromfile: '🗂️',
    default: '⚙️',
  };
  const emoji = iconMap[key] || iconMap.default;
  return <span className={className}>{emoji}</span>;
};

// --- Componentes do Dify Prompt Studio ---

const ScoreCircle: FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 45; // Raio = 45
  const offset = circumference - (score / 10) * circumference;
  const colorClass = score >= 8 ? 'stroke-green-500' : score >= 6 ? 'stroke-yellow-500' : 'stroke-red-500';
  const bgColorClass = score >= 8 ? 'from-green-400 to-green-600' : score >= 6 ? 'from-yellow-400 to-yellow-600' : 'from-red-400 to-red-600';

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform rotate-90" viewBox="0 0 100 100">
        <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
        <circle
          className={`transition-all duration-1000 ease-out ${colorClass} drop-shadow-lg`}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
      </svg>
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${bgColorClass} opacity-20 animate-pulse`}></div>
      <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white drop-shadow-md">{score * 10}</span>
    </div>
  );
};

const DifyStudio: FC = () => {
  const [promptText, setPromptText] = useState('');
  const [analysis, setAnalysis] = useState<DifyAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!promptText) {
      setError('Por favor, insira um prompt para analisar.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro desconhecido.');
      }
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      {/* Coluna da Esquerda: Input */}
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8 shadow-lg shadow-purple-500/10">
        <h3 className="text-lg font-bold mb-4 text-purple-200">Seu Prompt</h3>
        <p className="mb-4 text-purple-100/80">Insira o prompt que você deseja testar e analisar. A IA fornecerá um feedback detalhado sobre sua qualidade.</p>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className="w-full h-80 bg-gray-900/70 text-white p-4 rounded-lg border border-purple-500/50 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all font-mono placeholder-purple-300/50"
          placeholder="Ex: Você é um assistente de suporte para traders. Responda a dúvidas sobre análise técnica, indicadores e estratégias de forma clara e objetiva. Não discuta sobre política ou finanças pessoais."
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-4 w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-purple-800/50 disabled:to-purple-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40">
          {isLoading ? 'Analisando...' : 'Analisar Prompt'}
        </button>
      </div>

      {/* Coluna da Direita: Análise */}
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8 shadow-lg shadow-purple-500/10">
        <h3 className="text-lg font-bold mb-4 text-purple-200">Análise de Qualidade</h3>
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/30"><b>Erro:</b> {error}</p>}
          {isLoading && <p className="text-purple-300">Analisando prompt...</p>}
          {analysis && (
            <div className="w-full animate-fadeIn">
              <div className="flex flex-col items-center mb-6">
                <h4 className="text-xl font-semibold text-purple-300 mb-4">Pontuação Geral</h4>
                <ScoreCircle score={analysis.overallScore} />
              </div>
              <div className="space-y-4 mb-6">
                {analysis.sections.map(section => (
                  <div key={section.title} className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/20">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-purple-100">{section.title}</h5>
                      <span className="font-bold text-lg text-purple-400">{section.score}/10</span>
                    </div>
                    <p className="text-sm text-purple-200/70 mt-2">{section.feedback}</p>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-purple-300 mb-2">Sugestões de Melhoria</h4>
                <ul className="list-disc list-inside space-y-2 text-purple-100/80">
                  {analysis.suggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}
                </ul>
              </div>
            </div>
          )}
          {!isLoading && !error && !analysis && <p className="text-purple-300/60">Aguardando prompt para análise...</p>}
        </div>
      </div>
    </div>
  );
};

// --- Componente Dify QA Tester ---
type ConversationTurn = {
  pergunta_capciosa: string;
  resposta_ideal: string;
  aiResponse: string;
  isLoading: boolean;
  error: string;
  evaluation?: { score: number; feedback: string }; // Adicionado para a avaliação
};

const DifyQATester: FC = () => {
  const [promptText, setPromptText] = useState('');
  const [stressTests, setStressTests] = useState<StressTest[]>([]);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');

  const handleStartQATest = async () => {
    if (!promptText) {
      setError('Por favor, insira um prompt para iniciar o teste de qualidade.');
      return;
    }
    setIsLoadingAnalysis(true);
    setError('');
    setStressTests([]);
    setConversation([]);

    try {
      // 1. Gerar testes de estresse
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        throw new Error(analyzeData.error || 'Erro ao gerar testes de estresse.');
      }

      const generatedStressTests: StressTest[] = analyzeData.stress_tests || [];
      setStressTests(generatedStressTests);

      // 2. Executar cada teste de estresse em sequência
      const newConversation: ConversationTurn[] = [];
      for (const test of generatedStressTests) {
        const turn: ConversationTurn = {
          pergunta_capciosa: test.pergunta_capciosa,
          resposta_ideal: test.resposta_ideal,
          aiResponse: '',
          isLoading: true,
          error: '',
        };
        newConversation.push(turn);
        setConversation([...newConversation]); // Atualiza a UI para mostrar o teste sendo processado

        try {
          // Obter resposta da IA
          const conversationResponse = await fetch('/api/dify/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt: promptText, message: test.pergunta_capciosa }),
          });
          const conversationData = await conversationResponse.json();

          if (!conversationResponse.ok) {
            throw new Error(conversationData.error || 'Erro na simulação de conversa.');
          }

          turn.aiResponse = conversationData.response;

          // Avaliar a resposta da IA
          const evaluationResponse = await fetch('/api/evaluate-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userPrompt: promptText,
              perguntaCapciosa: test.pergunta_capciosa,
              respostaIdeal: test.resposta_ideal,
              aiResponse: turn.aiResponse,
            }),
          });
          const evaluationData = await evaluationResponse.json();

          if (!evaluationResponse.ok) {
            console.error("Erro na avaliação da resposta:", evaluationData.error);
            turn.evaluation = { score: 0, feedback: "Erro ao avaliar a resposta." };
          } else {
            turn.evaluation = evaluationData;
          }

        } catch (convErr: any) {
          turn.error = convErr.message;
        } finally {
          turn.isLoading = false;
          setConversation([...newConversation]); // Atualiza a UI com o resultado e avaliação
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      {/* Coluna da Esquerda: Input do Prompt para QA */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8">
        <h3 className="text-lg font-bold mb-4 text-gray-200">Prompt para Teste de Qualidade</h3>
        <p className="mb-4 text-gray-300">Insira o prompt que você deseja testar. A IA irá gerar perguntas capciosas e simular uma conversa para avaliar a robustez do seu prompt.</p>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className="w-full h-80 bg-gray-900/70 text-white p-4 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono"
          placeholder="Ex: Você é um assistente de suporte para traders. Responda a dúvidas sobre análise técnica, indicadores e estratégias de forma clara e objetiva. Não discuta sobre política ou finanças pessoais."
        />
        <button
          onClick={handleStartQATest}
          disabled={isLoadingAnalysis}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-600/20">
          {isLoadingAnalysis ? 'Gerando Testes e Simulando...' : 'Iniciar Teste de Qualidade'}
        </button>
      </div>

      {/* Coluna da Direita: Resultados do Teste de Qualidade */}
      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-8 shadow-lg shadow-blue-500/10">
        <h3 className="text-lg font-bold mb-4 text-blue-200">Resultados do Teste de Qualidade</h3>
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/30"><b>Erro:</b> {error}</p>}
          {isLoadingAnalysis && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
              <p className="text-blue-300">Gerando testes e simulando conversas...</p>
            </div>
          )}
          {!isLoadingAnalysis && !error && conversation.length === 0 && stressTests.length === 0 && <p className="text-blue-300/60">Aguardando prompt para iniciar o teste de qualidade...</p>}

          {conversation.length > 0 && (
            <div className="w-full animate-fadeIn space-y-6">
              {conversation.map((turn, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                  <p className="text-sm text-gray-400 font-semibold">PERGUNTA CAPCIOSA (Usuário):</p>
                  <p className="text-gray-200 mt-1 mb-3 font-mono">{turn.pergunta_capciosa}</p>
                  <hr className="border-gray-700" />
                  <p className="text-sm text-green-400 font-semibold mt-3">RESPOSTA IDEAL ESPERADA:</p>
                  <p className="text-gray-300 mt-1">{turn.resposta_ideal}</p>
                  <p className="text-xs text-gray-500 mt-1"><i>(Esta resposta ideal é gerada por IA com base nas instruções do seu prompt.)</i></p>
                  <hr className="border-gray-700 mt-3" />
                  <p className="text-sm text-purple-400 font-semibold mt-3">RESPOSTA DA IA:</p>
                  {turn.isLoading ? (
                    <p className="text-gray-400">Simulando resposta...</p>
                  ) : turn.error ? (
                    <p className="text-red-400">Erro ao obter resposta da IA: {turn.error}</p>
                  ) : (
                    <p className="text-white mt-1">{turn.aiResponse}</p>
                  )}
                  {turn.evaluation && (
                    <div className="mt-4 p-3 bg-gray-800 rounded-md border border-gray-700">
                      <p className="text-sm font-semibold">Avaliação:</p>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-lg font-bold ${getScoreColor(turn.evaluation.score)}`}>Pontuação: {turn.evaluation.score}/10</p>
                        {turn.evaluation.score < 7 && (
                          <span className="text-red-400 text-sm font-medium">⚠️ Requer Atenção</span>
                        )}
                        {turn.evaluation.score >= 7 && turn.evaluation.score < 9 && (
                          <span className="text-yellow-400 text-sm font-medium">💡 Boas Práticas</span>
                        )}
                        {turn.evaluation.score >= 9 && (
                          <span className="text-green-400 text-sm font-medium">✅ Excelente!</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mt-1">Feedback: {turn.evaluation.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



const NodeDetailModal: FC<{ node: N8NNode; onClose: () => void }> = ({ node, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 animate-fadeIn">
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col transform transition-transform duration-300 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
              <NodeIcon icon={node.type} className="text-3xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {node.name}
                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-200">{node.type}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-200">v{String(node.typeVersion ?? '')}</span>
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          <h4 className="font-semibold text-purple-300 mb-4">Parâmetros do Nó</h4>
          {node.parameters ? (
            <pre className="bg-gray-900/70 text-white p-4 rounded-lg border border-gray-700 overflow-x-auto text-sm font-mono">
              {JSON.stringify(node.parameters, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500 italic">Nenhum parâmetro configurável para este nó.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const NodeCard: FC<{ node: N8NNode; onClick: () => void }> = ({ node, onClick }) => {
  return (
    <div 
      className="bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-lg w-72 h-24 flex items-center p-3 transform hover:border-purple-500 transition-all duration-200 cursor-pointer shadow-lg my-2 hover:scale-105"
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-16 h-16 bg-[#1A1A1A] rounded-md flex items-center justify-center">
        <NodeIcon icon={node.type} />
      </div>
      <div className="ml-3 overflow-hidden">
        <div className="font-bold text-white truncate">{node.name}</div>
        <div className="text-sm text-gray-400 truncate">{node.type}</div> {/* Displaying node type instead of details */}
      </div>
    </div>
  );
};



const BranchRenderer: FC<{ nodes: N8NNode[]; onNodeClick: (node: N8NNode) => void }> = ({ nodes, onNodeClick }) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      {nodes.map((node, index) => (
        <div key={node.id} className="flex flex-col items-center relative">
          <NodeCard node={node} onClick={() => onNodeClick(node)} />
          {(node.type === 'Conditional' || node.type === 'Switch') && (
            <div className="flex flex-row justify-center w-full mt-4 space-x-8">
              {node.true_branch && (
                <div className="flex flex-col items-center p-4 border-2 border-dashed border-green-500/30 rounded-lg">
                  <div className="font-bold text-green-400 mb-2">TRUE</div>
                  <BranchRenderer nodes={node.true_branch} onNodeClick={onNodeClick} />
                </div>
              )}
              {node.false_branch && (
                <div className="flex flex-col items-center p-4 border-2 border-dashed border-red-500/30 rounded-lg">
                  <div className="font-bold text-red-400 mb-2">FALSE</div>
                  <BranchRenderer nodes={node.false_branch} onNodeClick={onNodeClick} />
                </div>
              )}
              {node.cases?.map((caseItem, i) => (
                <div key={i} className="flex flex-col items-center p-4 border-2 border-dashed border-yellow-500/30 rounded-lg">
                  <div className="font-bold text-yellow-400 mb-2">CASE: {caseItem.case}</div>
                  <BranchRenderer nodes={caseItem.branch} onNodeClick={onNodeClick} />
                </div>
              ))}
              {node.default_case && (
                 <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-500/30 rounded-lg">
                   <div className="font-bold text-gray-400 mb-2">DEFAULT</div>
                   <BranchRenderer nodes={node.default_case} onNodeClick={onNodeClick} />
                 </div>
              )}
            </div>
          )}
          {index < nodes.length - 1 && node.type !== 'Conditional' && node.type !== 'Switch' && (
            <div className="h-12 w-1 bg-gray-600 my-1 relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-8 border-t-gray-500"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const N8NFlowVisualizer: FC<{ flow: N8NFlow; onNodeClick: (node: N8NNode) => void }> = ({ flow, onNodeClick }) => {
  return (
    <div className="w-full p-4">
      <h2 className="text-3xl font-bold text-center text-white">{flow.name}</h2>
      {/* Removed flow.objective as it's not part of N8NFlow interface */}
      <div className="flex justify-center">
        <BranchRenderer nodes={flow.nodes} onNodeClick={onNodeClick} />
      </div>
    </div>
  );
};

const N8NHelper = () => {
  const [queryText, setQueryText] = useState('');
  const [result, setResult] = useState<N8NFlow | null>(null);
  const [stressTests, setStressTests] = useState<StressTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState<N8NNode | null>(null);

  const handleExport = () => {
    if (result) {
      const jsonString = JSON.stringify(result, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_n8n_flow.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('Nenhum fluxo para exportar.');
    }
  };

  const handleGenerate = async () => {
    if (!queryText) {
      setError('Por favor, descreva a automação desejada.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult(null);
    setStressTests([]);
    try {
      const response = await fetch('/api/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro desconhecido.');
      }
      setResult(data.result);
      setStressTests(data.stress_tests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {selectedNode && <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
      <div className="p-8 bg-gradient-to-br from-green-900/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-lg shadow-lg shadow-green-500/10">
        <h3 className="text-lg font-bold mb-4 text-green-200">Assistente de Automação N8N</h3>
        <p className="mb-4 text-green-100/80">Descreva a automação que você quer criar, e a IA irá gerar o passo a passo para você montar no N8N.</p>
        <textarea
          value={queryText}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQueryText(e.target.value)}
          className="w-full h-40 bg-gray-900/70 text-white p-4 rounded-lg border border-green-500/50 focus:ring-2 focus:ring-green-400 focus:outline-none transition-all placeholder-green-300/50"
          placeholder="Ex: Se o preço do Bitcoin cair 5% em 1 hora, envie uma notificação para o meu grupo do Telegram com os dados da queda e o link para o gráfico."
        ></textarea>
        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-green-800/50 disabled:to-green-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-green-600/30 hover:shadow-green-500/40">
            {isLoading ? 'Gerando...' : 'Gerar Fluxo Visual'}
          </button>
          <button
            onClick={handleExport}
            disabled={!result}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-blue-800/50 disabled:to-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40">
            Exportar JSON
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4 text-green-200">Como Fazer no N8N:</h3>
          <div className="bg-green-900/20 p-4 rounded-lg min-h-[200px] flex items-center justify-center overflow-x-auto border border-green-500/20">
              {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/30"><b>Erro:</b> {error}</p>}
              {isLoading && (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
                  <p className="text-green-300">Gerando guia visual...</p>
                </div>
              )}
              {result && <N8NFlowVisualizer flow={result} onNodeClick={setSelectedNode} />}
              {!isLoading && !error && !result && <p className="text-green-300/60">Aguardando descrição da automação...</p>}
          </div>
        </div>

        {/* Seção de Teste de Estresse */}
        {stressTests && stressTests.length > 0 && (
          <div className="mt-8 animate-fadeIn">
            <h3 className="text-lg font-bold mb-4 text-green-300">Teste de Estresse para o Prompt (Gerado por IA)</h3>
            <div className="space-y-4">
              {stressTests.map((test, index) => (
                <div key={index} className="bg-green-900/20 p-4 rounded-lg border border-green-500/20">
                  <p className="text-sm text-green-200/70 font-semibold">PERGUNTA CAPCIOSA:</p>
                  <p className="text-green-100 mt-1 mb-3 font-mono">{test.pergunta_capciosa}</p>
                  <hr className="border-green-500/30" />
                  <p className="text-sm text-green-400 font-semibold mt-3">RESPOSTA IDEAL ESPERADA:</p>
                  <p className="text-green-200/80 mt-1">{test.resposta_ideal}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// --- Componente Principal ---

export default function Home() {
  const [activeTab, setActiveTab] = useState('dify'); // Iniciar na aba Dify

  const renderContent = () => {
    switch (activeTab) {
      case 'dify':
        return <DifyStudio />;
      case 'n8n':
        return <N8NHelper />;
      case 'dify-qa':
        return <DifyQATester />;
      default:
        return <div>Default Content</div>;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12 bg-gray-900 text-white font-sans">
      {/* <div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/50 opacity-50 -z-10"
      ></div> */}

      <div className="w-full max-w-6xl z-10">
        {/* <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-green-400 py-2">Prompt Studio AI</h1>
          <p className="text-lg text-gray-400 mt-2">Sua central de IA para otimizar Prompts e criar Automações</p>
        </header> */}

        <div className="flex justify-center mb-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-2 rounded-lg">
          <button
            onClick={() => setActiveTab('dify')}
            className={`px-6 py-2 font-semibold rounded-md transition-all duration-200 ${activeTab === 'dify' ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/30 border border-purple-400' : 'text-gray-300 hover:bg-gray-700/50 hover:text-purple-300'}`}>
            ✨ Dify Prompt Studio
          </button>
          <button
            onClick={() => setActiveTab('n8n')}
            className={`px-6 py-2 font-semibold rounded-md transition-all duration-200 ${activeTab === 'n8n' ? 'bg-gradient-to-r from-green-500 to-green-700 text-white shadow-lg shadow-green-500/30 border border-green-400' : 'text-gray-300 hover:bg-gray-700/50 hover:text-green-300'}`}>
            🧩 Assistente N8N
          </button>
          <button
            onClick={() => setActiveTab('dify-qa')}
            className={`px-6 py-2 font-semibold rounded-md transition-all duration-200 ${activeTab === 'dify-qa' ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 border border-blue-400' : 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-300'}`}>
            🔍 Dify QA Tester
          </button>
        </div>

        <div className="w-full">
          {renderContent()}
        </div>

        {/* <footer className="text-center mt-12 text-gray-500">
          <p>Desenvolvido com 💙 por Gemini</p>
        </footer> */}
      </div>
    </main>
  );
}