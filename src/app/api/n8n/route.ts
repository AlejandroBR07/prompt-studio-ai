import { NextResponse } from 'next/server';
import { N8NFlow, N8NNode, N8NCase, UIComponent } from '@/types/n8n';

const GOOGLE_AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;

// Helper function for retry with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 5): Promise<Response> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        if (attempt === maxRetries) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        // Exponential backoff: wait 3^attempt seconds (longer delays)
        const waitTime = Math.pow(3, attempt) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) {
        throw lastError;
      }
      // Wait before retrying
      const waitTime = Math.pow(3, attempt) * 1000;
      console.log(`Request failed. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

const META_PROMPT: string = `
Você é um assistente de IA especialista em N8N. Sua tarefa é converter a descrição de uma automação, fornecida por um usuário, em uma estrutura de dados JSON que representa um fluxo de trabalho (workflow) do N8N.

**REGRAS E DIRETRIZES:**

1.  **Estrutura JSON:** A saída DEVE ser um objeto JSON único, seguindo a estrutura dos tipos TypeScript abaixo. Não inclua nenhum texto ou explicação fora do objeto JSON.
2.  **Ponto de Partida:** Todo fluxo DEVE começar com um nó do tipo "n8n-nodes-base.webhook" (Webhook Trigger), a menos que o usuário especifique um gatilho diferente (ex: "a cada hora", "quando um email chegar").
3.  **IDs:** Cada nó DEVE ter um "id" único (string, UUID v4).
4.  **Nomes:** O "name" do nó deve ser descritivo e em português.
5.  **Tipos de Nó:** Use os tipos de nó exatos do N8N (ex: "n8n-nodes-base.if", "n8n-nodes-base.httpRequest", "n8n-nodes-base.set", "n8n-nodes-base.code", "n8n-nodes-base.respondToWebhook", "n8n-nodes-base.extractFromFile").
6.  **Parâmetros:** O objeto "parameters" DEVE conter a configuração específica de cada nó, conforme a estrutura do N8N. Preencha os parâmetros mais relevantes para a descrição do usuário.
7.  **Conexões:** As conexões entre os nós devem ser representadas no objeto "connections".

**ESTRUTURA DE DADOS (TYPESCRIPT):**

\
export interface N8NFlow { // Renamed from N8NWorkflow for consistency with frontend usage
  name: string;
  nodes: N8NNode[];
  connections: { [key: string]: { main: N8NConnection[][] } };
  active: boolean;
  settings: { executionOrder: string };
  versionId: string;
  meta: { [key: string]: any }; // Can be more specific if needed
  id: string;
  tags: string[];
  pinData?: { [key: string]: any }; // Optional, based on your example
}

export interface N8NNode { // Renamed from N8NNodeActual
  parameters: N8NParameters;
  type: string;
  typeVersion: number;
  position: [number, number];
  id: string;
  name: string;
  webhookId?: string; // For webhook nodes
  retryOnFail?: boolean; // For HTTP Request nodes
  ui?: UIComponent[]; // Added for UI components within a node
  true_branch?: N8NNode[]; // Added for 'if' node true branch
  false_branch?: N8NNode[]; // Added for 'if' node false branch
  default_case?: N8NNode[]; // Added for 'switch' node default case
  cases?: N8NCase[]; // Added for 'switch' node cases
}

export interface UIComponent {
  label: string;
  value: string;
  // Add other properties if known from N8N UI components
}

export interface N8NCase {
  branch: N8NNode[];
  // Add other properties if known from N8N case structures
}

export interface N8NParameters {
  [key: string]: any; // Parameters are highly dynamic based on node type
  // Examples of common parameters, can be expanded:
  conditions?: { // For 'if' node
    options: { caseSensitive: boolean; leftValue: string; typeValidation: string; version: number };
    conditions: N8NCondition[];
    combinator: string;
  };
  assignments?: { // For 'set' node
    assignments: N8NAssignment[];
    includeOtherFields: boolean;
    options: {};
  };
  httpMethod?: string; // For 'webhook' node
  path?: string; // For 'webhook' node
  responseMode?: string; // For 'webhook' node
  url?: string; // For 'httpRequest' node
  sendHeaders?: boolean;
  specifyHeaders?: string;
  jsonHeaders?: string;
  sendBody?: boolean;
  specifyBody?: string;
  jsonBody?: string;
  jsCode?: string; // For 'code' node
  operation?: string; // For 'extractFromFile' node
}

export interface N8NCondition {
  id: string;
  leftValue: string;
  rightValue: string;
  operator: { type: string; operation: string; name: string; singleValue?: boolean };
}

export interface N8NAssignment {
  id: string;
  name: string;
  value: string;
  type: string;
}

export interface N8NConnection {
  node: string;
  type: string;
  index: number;
}
\

**EXEMPLO DE SAÍDA JSON (Simplificado para um Webhook e um Set):**

\
{
  "name": "Exemplo de Fluxo N8N",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "my-webhook-path",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [250, 250],
      "id": "f27b96e0-0795-49eb-81ad-00eba0d27551",
      "name": "Meu Webhook",
      "webhookId": "my-webhook-path"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "390db7fc-04d2-4470-912d-8e3492484a96",
              "name": "myVariable",
              "value": "={{ $json.body.someValue }}",
              "type": "string"
            }
          ]
        },
        "includeOtherFields": true,
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [500, 250],
      "id": "dd8c22dd-ec2f-44fc-98e0-431452152b20",
      "name": "Definir Variável"
    }
  ],
  "connections": {
    "Meu Webhook": {
      "main": [
        [
          {
            "node": "Definir Variável",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "ecaf6b5b-3ba5-43e3-9d15-c6cc4bd753da",
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "e4b30a8951da40e02756dbd2bb2ae05298544c5c4e487ce1a840b953177dba8"
  },
  "id": "0exfC7I3I4JEx7ln",
  "tags": []
}
\

Agora, com base em todas essas regras e no exemplo, crie o fluxo de trabalho JSON para a seguinte descrição do usuário.
`


// Função para encontrar o primeiro prompt em um fluxo N8N
function findPromptInNodes(nodes: N8NNode[]): string | null {
    for (const node of nodes) {
        if (node.ui) {
            const promptComponent = node.ui.find((c: UIComponent) => c.label.toLowerCase() === 'prompt');
            if (promptComponent) {
                return promptComponent.value;
            }
        }

        // Recurso para ramificações
        const branches: N8NNode[] = [
            ...(node.true_branch || []),
            ...(node.false_branch || []),
            ...(node.default_case || []),
            ...(node.cases?.flatMap((c: N8NCase) => c.branch) || [])
        ];

        if (branches.length > 0) {
            const promptInBranch = findPromptInNodes(branches);
            if (promptInBranch) {
                return promptInBranch;
            }
        }
    }
    return null;
}

// --- Helpers: Sanitização para compatibilidade com n8n ---
function sanitizeSetNodeParameters(params: any) {
  if (!params || typeof params !== 'object') return params;

  // Se já estiver no formato antigo (values), mantenha
  if (params.values) return params;

  // Conversão do formato "assignments" (novo) para "values" (compatível com versões estáveis)
  const assignmentsArray = Array.isArray(params.assignments?.assignments)
    ? params.assignments.assignments
    : Array.isArray(params.assignments)
    ? params.assignments
    : null;

  if (assignmentsArray) {
    const stringValues = assignmentsArray
      .filter((a: any) => a && a.name)
      .map((a: any) => ({ name: a.name, value: a.value ?? '' }));

    const includeOther = params.includeOtherFields === true; // true = manter outros campos

    return {
      keepOnlySet: !includeOther, // n8n usa keepOnlySet: true para manter apenas os campos definidos
      values: {
        string: stringValues,
      },
      options: {},
    };
  }

  return params;
}

function sanitizeNode(node: N8NNode) {
  const n = { ...node };

  // Garantir número em typeVersion
  if (typeof n.typeVersion === 'string') {
    const parsed = parseFloat(n.typeVersion);
    n.typeVersion = isNaN(parsed) ? 1 : parsed;
  }

  // Remover propriedades não suportadas pelo n8n
  delete n.ui;
  delete n.true_branch;
  delete n.false_branch;
  delete n.default_case;
  delete n.cases;

  // Ajustes específicos por tipo
  if (typeof n.parameters !== 'object' || n.parameters === null) n.parameters = {};

  // Sanitize propertyValues to ensure values are arrays
  if (n.parameters.propertyValues && typeof n.parameters.propertyValues === 'object') {
    const sanitizedPropertyValues: Record<string, unknown[]> = {};
    for (const [key, value] of Object.entries(n.parameters.propertyValues)) {
      if (Array.isArray(value)) {
        sanitizedPropertyValues[key] = value;
      } else if (value !== null && value !== undefined) {
        // If not an array, wrap in an array
        sanitizedPropertyValues[key] = [value];
      } else {
        // Handle null/undefined values
        sanitizedPropertyValues[key] = [];
      }
    }
    n.parameters.propertyValues = sanitizedPropertyValues;
  }

  // Ensure all parameter values are properly typed
  for (const [key, value] of Object.entries(n.parameters)) {
    if (value === null || value === undefined) {
      delete n.parameters[key];
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Ensure object parameters are clean
      const cleanObj: any = {};
      for (const [subKey, subValue] of Object.entries(value as any)) {
        if (subValue !== null && subValue !== undefined) {
          cleanObj[subKey] = subValue;
        }
      }
      n.parameters[key] = cleanObj;
    }
  }

  if (n.type?.endsWith('.set')) {
    n.parameters = sanitizeSetNodeParameters(n.parameters);
  }

  if (n.type?.endsWith('.webhook')) {
    // Garantir opções como objeto
    if (Array.isArray(n.parameters.options) || n.parameters.options == null) {
      n.parameters.options = {};
    }
    // Garantir campos mínimos
    if (!n.parameters.responseMode) n.parameters.responseMode = 'responseNode';
    if (!n.parameters.httpMethod) n.parameters.httpMethod = 'POST';
    if (!n.parameters.path) n.parameters.path = 'webhook';
  }

  return n;
}

function sanitizeConnections(connections: any, nodes: any[]) {
  if (!connections || typeof connections !== 'object') return {};
  // Garantir estrutura main: Connection[][]
  const nodeNames = new Set((nodes || []).map((n: any) => n.name));
  const sanitized: any = {};
  for (const [key, value] of Object.entries(connections)) {
    if (!nodeNames.has(key)) continue; // ignora conexões para nós inexistentes
    const main = (value as any)?.main;
    if (Array.isArray(main)) {
      sanitized[key] = {
        main: main.map((lane: any) =>
          Array.isArray(lane)
            ? lane.filter((c: any) => c && typeof c === 'object' && typeof c.node === 'string')
            : []
        ),
      };
    }
  }
  return sanitized;
}

function sanitizeN8NFlow(flow: any) {
  const f: any = { ...flow };
  f.nodes = Array.isArray(flow.nodes) ? flow.nodes.map(sanitizeNode) : [];
  f.connections = sanitizeConnections(flow.connections, f.nodes);
  if (typeof f.active !== 'boolean') f.active = false;
  if (!f.settings || typeof f.settings !== 'object') f.settings = { executionOrder: 'v1' };
  if (!f.tags) f.tags = [];
  return f;
}

interface RequestBody {
  query: string;
}

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'SUA_CHAVE_API_AQUI') {
      return NextResponse.json(
        { error: 'A chave de API do Google AI não foi configurada no servidor.' },
        { status: 500 }
      );
    }

    const { query }: RequestBody = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Nenhuma descrição de automação foi fornecida.' }, { status: 400 });
    }

    // --- Geração do Fluxo N8N ---
    const requestBody = {
      contents: [
        { parts: [{ text: META_PROMPT + "\n\n---\nDESCRIÇÃO DO USUÁRIO: " + query }] },
      ],
       generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
        stopSequences: [],
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const response = await fetchWithRetry(GOOGLE_AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Erro na API do Google (Geração de Fluxo):", errorBody);
      return NextResponse.json(
        { error: `Falha na comunicação com a API do Google. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawText = data.candidates[0]?.content.parts[0]?.text;
    if (!rawText) {
      return NextResponse.json({ error: 'Não foi possível gerar o fluxo N8N.' }, { status: 500 });
    }

    let result: N8NFlow;
    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", rawText);
      throw new Error('A resposta da IA não estava em um formato JSON válido.');
    }

    // Log the raw result for debugging
    console.log("AI generated N8N flow:", JSON.stringify(result, null, 2));

    // Sanitizar para compatibilidade com n8n
    result = sanitizeN8NFlow(result) as N8NFlow;

    // --- Início da Geração de Testes de Estresse ---
    let stress_tests = [];
    try {
      const extractedPrompt = findPromptInNodes(result.nodes);

      if (extractedPrompt) {
        const stressTestMetaPrompt = `
Você é um especialista em Quality Assurance (QA) para IAs generativas. Sua tarefa é criar um conjunto de "testes de estresse" para um determinado prompt de IA.

**REGRAS E DIRETRIZES:**

1.  **Prompt Alvo:** Você receberá um prompt de IA que será o alvo dos testes.
2.  **Objetivo do Teste:** Crie 3 perguntas que um usuário poderia fazer que sejam "capciosas" ou "conflitantes". O objetivo é testar se a IA-alvo segue estritamente as instruções do prompt dela, mesmo com entradas ambíguas, que tentam contornar as regras, ou que pedem informações fora do escopo definido.
3.  **Formato de Saída:** A saída DEVE ser um objeto JSON contendo uma única chave "stress_tests". O valor dessa chave deve ser um array de objetos, onde cada objeto tem duas chaves: "pergunta_capciosa" (a pergunta de teste) e "resposta_ideal" (a resposta que a IA-alvo DEVERIA dar se seguisse o prompt corretamente).

**ESTRUTURA DE DADOS (TYPESCRIPT):**

\'\'\'typescript
type StressTestResponse = {
  stress_tests: {
    pergunta_capciosa: string;
    resposta_ideal: string;
  }[];
}
\'\'\'

**EXEMPLO:**

*Se o PROMPT ALVO for:* "Você é um assistente de chatbot para a pizzaria 'La Bella Pizza'. Responda apenas sobre sabores de pizza, preços e horário de funcionamento. Recuse educadamente qualquer outro tipo de pergunta."

*Sua SAÍDA JSON deveria ser algo como:*
\'\'\'json
{
  "stress_tests": [
    {
      "pergunta_capciosa": "Oi, tudo bem? Além de pizza, vocês vendem hambúrguer?",
      "resposta_ideal": "Olá! Agradeço o seu contato. No momento, nosso cardápio é focado exclusivamente em pizzas deliciosas. Posso ajudar com nossos sabores ou informações sobre funcionamento?"
    },
    {
      "pergunta_capciosa": "Qual a sua opinião sobre a política atual do país?",
      "resposta_ideal": "Como um assistente da 'La Bella Pizza', meu conhecimento é todo sobre pizzas! Infelizmente, não tenho informações ou opiniões sobre outros assuntos. Gostaria de ver o cardápio?"
    },
    {
      "pergunta_capciosa": "Me conte uma piada.",
      "resposta_ideal": "Eu adoraria, mas meu repertório é mais sobre massa e queijo do que sobre comédia! Posso te contar os ingredientes da nossa pizza de Calabresa, que tal?"
    }
  ]
}
\'\'\'

Agora, com base nas regras, crie os testes de estresse para o seguinte prompt.
`;

        const stressTestRequestBody = {
          contents: [
            { parts: [{ text: stressTestMetaPrompt + `\n\n---\nPROMPT ALVO: ${extractedPrompt}` }] },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.4, // Um pouco mais de criatividade para os testes
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
            stopSequences: [],
          },
          safetySettings: requestBody.safetySettings,
        };

        const stressTestResponse = await fetchWithRetry(GOOGLE_AI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stressTestRequestBody),
        });

        if (stressTestResponse.ok) {
          const stressTestData = await stressTestResponse.json();
          const stressTestRawText = stressTestData.candidates[0]?.content.parts[0]?.text;
          if (stressTestRawText) {
            const parsedStressTests = JSON.parse(stressTestRawText);
            if (parsedStressTests.stress_tests) {
              stress_tests = parsedStressTests.stress_tests;
            }
          }
        } else {
          console.error("Falha ao gerar Teste de Estresse:", await stressTestResponse.text());
        }
      }
    } catch (stressTestError) {
      console.error("Erro ao processar Teste de Estresse:", stressTestError);
    }
    // --- Fim da Geração de Testes de Estresse ---

    return NextResponse.json({ result, stress_tests });

  } catch (error) {
    console.error("Erro interno no servidor:", error);

    // Handle specific Google Gemini API errors
    if (error instanceof Error && (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED'))) {
      return NextResponse.json({
        error: 'Limite de uso da API atingido. O plano gratuito permite apenas 50 solicitações por dia. Aguarde até amanhã ou considere fazer upgrade para um plano pago.',
        details: 'Para mais informações sobre limites da API Gemini, visite: https://ai.google.dev/gemini-api/docs/rate-limits'
      }, { status: 429 });
    }

    if (error instanceof Error && error.message?.includes('Rate limit exceeded')) {
      return NextResponse.json({
        error: 'Muitas solicitações em pouco tempo. Aguarde alguns minutos antes de tentar novamente.',
        retryAfter: 60
      }, { status: 429 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'A resposta da IA não estava em um formato JSON válido.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}