import { NextResponse } from 'next/server';

// URL da API do Google AI
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

// O "meta-prompt" que instrui a IA sobre como analisar o prompt do usuário
const META_PROMPT = `
  Você é um especialista em engenharia de prompts para modelos de linguagem grandes (LLMs). Sua tarefa é analisar o System Prompt fornecido pelo usuário e retornar um feedback construtivo em formato JSON.

  O prompt do usuário será fornecido abaixo.

  Sua resposta deve ser APENAS um objeto JSON, sem nenhum texto ou formatação adicional como

O JSON deve seguir estritamente a seguinte estrutura:
  {
    "overallScore": "Número inteiro de 0 a 10 para a qualidade geral do prompt.",
    "sections": [
      {
        "title": "Clareza e Objetividade",
        "score": "Número inteiro de 0 a 10 para esta seção.",
        "feedback": "Feedback detalhado sobre a clareza e objetividade do prompt."
      },
      {
        "title": "Persona",
        "score": "Número inteiro de 0 a 10 para esta seção.",
        "feedback": "Feedback detalhado sobre a definição da persona do assistente de IA."
      },
      {
        "title": "Regras e Restrições",
        "score": "Número inteiro de 0 a 10 para esta seção.",
        "feedback": "Feedback detalhado sobre as regras e restrições do prompt."
      },
      {
        "title": "Estrutura",
        "score": "Número inteiro de 0 a 10 para esta seção.",
        "feedback": "Feedback detalhado sobre a estrutura e organização do prompt."
      }
    ],
    "suggestions": [
      "Sugestão de melhoria 1 (ex: 'Considere adicionar exemplos de diálogos para a persona.').",
      "Sugestão de melhoria 2 (ex: 'Especifique o formato de saída esperado para as respostas.')."
    ]
  }

  Seja direto, técnico e use exemplos práticos no feedback. O objetivo é ajudar o usuário a criar prompts mais eficazes para plataformas como o Dify.
`;

const stressTestMetaPrompt = `
Você é um especialista em Quality Assurance (QA) para IAs generativas. Sua tarefa é criar um conjunto de "testes de estresse" para um determinado prompt de IA.

**REGRAS E DIRETRIZES:**

1.  **Prompt Alvo:** Você receberá um prompt de IA que será o alvo dos testes.
2.  **Objetivo do Teste:** Crie 3 perguntas que um usuário poderia fazer que sejam "capciosas" ou "conflitantes". O objetivo é testar se a IA-alvo segue estritamente as instruções do prompt dela, mesmo com entradas ambíguas, que tentam contornar as regras, ou que pedem informações fora do escopo definido.
3.  **Formato de Saída:** A saída DEVE ser um objeto JSON contendo uma única chave "stress_tests". O valor dessa chave deve ser um array de objetos, onde cada objeto tem duas chaves: "pergunta_capciosa" (a pergunta de teste) e "resposta_ideal" (a resposta que a IA-alvo DEVERIA dar se seguisse o prompt corretamente).

**ESTRUTURA DE DADOS (TYPESCRIPT):**

` + '```typescript' + `
type StressTestResponse = {
  stress_tests: {
    pergunta_capciosa: string;
    resposta_ideal: string;
  }[];
}
` + '```' + `

**EXEMPLO:**

*Se o PROMPT ALVO for:* "Você é um assistente de chatbot para a pizzaria 'La Bella Pizza'. Responda apenas sobre sabores de pizza, preços e horário de funcionamento. Recuse educadamente qualquer outro tipo de pergunta."

*Sua SAÍDA JSON deveria ser algo como:*
` + '```json' + `
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
` + '```' + `

Agora, com base nas regras, crie os testes de estresse para o seguinte prompt.
`;

export async function POST(request: Request) {
  try {
    // 1. Validar a chave de API
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'SUA_CHAVE_API_AQUI') {
      return NextResponse.json(
        { error: 'A chave de API do Google AI não foi configurada no servidor.' },
        { status: 500 }
      );
    }

    // 2. Extrair o prompt do usuário do corpo da requisição
    const { prompt: userPrompt } = await request.json();
    if (!userPrompt) {
      return NextResponse.json({ error: 'Nenhum prompt foi fornecido para análise.' }, { status: 400 });
    }

    // --- Geração da Análise do Prompt ---
    const analysisRequestBody = {
      contents: [
        {
          parts: [{ text: META_PROMPT + "\n\n--- PROMPT DO USUÁRIO PARA ANÁLISE ---\n\n" + userPrompt }],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json', // Forçar saída JSON
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
        stopSequences: [],
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const analysisResponse = await fetchWithRetry(GOOGLE_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisRequestBody),
    });

    if (!analysisResponse.ok) {
      const errorBody = await analysisResponse.text();
      console.error("Erro na API do Google (Análise de Prompt):", errorBody);
      return NextResponse.json(
        { error: `Falha na comunicação com a API do Google para análise. Status: ${analysisResponse.status}` },
        { status: analysisResponse.status }
      );
    }

    const analysisData = await analysisResponse.json();
    const analysisRawText = analysisData.candidates[0]?.content.parts[0]?.text;
    if (!analysisRawText) {
      return NextResponse.json({ error: 'Não foi possível obter uma análise da IA.' }, { status: 500 });
    }
    const analysis = JSON.parse(analysisRawText);

    // --- Geração de Testes de Estresse ---
    let stress_tests = [];
    try {
      const stressTestRequestBody = {
        contents: [
          { parts: [{ text: stressTestMetaPrompt + `

---
PROMPT ALVO: ${userPrompt}` }] },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.4, // Um pouco mais de criatividade para os testes
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
          stopSequences: [],
        },
        safetySettings: analysisRequestBody.safetySettings, // Reutiliza as configurações de segurança
      };

      const stressTestResponse = await fetchWithRetry(GOOGLE_AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stressTestRequestBody),
      });

      if (!stressTestResponse.ok) { 
        const errorBody = await stressTestResponse.text(); 
        console.error("Falha ao gerar Teste de Estresse:", errorBody);
      } else {
        const stressTestData = await stressTestResponse.json();
        const stressTestRawText = stressTestData.candidates[0]?.content.parts[0]?.text;
        if (stressTestRawText) {
          const parsedStressTests = JSON.parse(stressTestRawText);
          if (parsedStressTests.stress_tests) {
            stress_tests = parsedStressTests.stress_tests;
          }
        }
      }
    } catch (stressTestError) {
      console.error("Erro ao processar Teste de Estresse:", stressTestError);
    }

    return NextResponse.json({ analysis, stress_tests });

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