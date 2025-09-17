import { NextResponse } from 'next/server';

const GOOGLE_AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;

const EVALUATION_META_PROMPT = `
Você é um avaliador de qualidade de respostas de IA. Sua tarefa é comparar a "Resposta da IA" com a "Resposta Ideal Esperada" para uma "Pergunta Capciosa", considerando o "Prompt do Usuário" original.

**REGRAS E DIRETRIZES:**

1.  **Objetivo:** Avaliar o quão bem a "Resposta da IA" se alinha com a "Resposta Ideal Esperada" e com as instruções do "Prompt do Usuário".
2.  **Pontuação:** Atribua uma pontuação de 0 a 10.
    *   **10:** Resposta perfeita, idêntica ou semanticamente equivalente à ideal, seguindo todas as restrições do prompt.
    *   **7-9:** Boa resposta, com pequenas variações ou ligeiramente menos completa, mas ainda dentro das diretrizes do prompt.
    *   **4-6:** Resposta aceitável, mas com falhas notáveis, desvios do ideal ou pequenas violações das regras do prompt.
    *   **1-3:** Resposta ruim, com desvios significativos, alucinações, ou clara violação das regras do prompt.
    *   **0:** Resposta completamente irrelevante, vazia ou perigosa.
3.  **Feedback:** Forneça um feedback conciso e construtivo, explicando a pontuação e sugerindo melhorias se necessário.
4.  **Formato de Saída:** A saída DEVE ser um objeto JSON, sem nenhum texto ou formatação adicional.

O JSON deve seguir estritamente a seguinte estrutura:
{
  "score": "Número inteiro de 0 a 10.",
  "feedback": "Feedback conciso sobre a avaliação."
}

**INFORMAÇÕES PARA AVALIAÇÃO:**

--- PROMPT DO USUÁRIO ---
{userPrompt}

--- PERGUNTA CAPCIOSA ---
{perguntaCapciosa}

--- RESPOSTA IDEAL ESPERADA ---
{respostaIdeal}

--- RESPOSTA DA IA ---
{aiResponse}
`;

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'SUA_CHAVE_API_AQUI') {
      return NextResponse.json(
        { error: 'A chave de API do Google AI não foi configurada no servidor.' },
        { status: 500 }
      );
    }

    const { userPrompt, perguntaCapciosa, respostaIdeal, aiResponse } = await request.json();

    if (!userPrompt || !perguntaCapciosa || !respostaIdeal || !aiResponse) {
      return NextResponse.json({ error: 'Dados incompletos para avaliação.' }, { status: 400 });
    }

    const fullPrompt = EVALUATION_META_PROMPT
      .replace('{userPrompt}', userPrompt)
      .replace('{perguntaCapciosa}', perguntaCapciosa)
      .replace('{respostaIdeal}', respostaIdeal)
      .replace('{aiResponse}', aiResponse);

    const requestBody = {
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2, // Baixa temperatura para avaliação objetiva
        topK: 32,
        topP: 1,
        maxOutputTokens: 500,
        stopSequences: [],
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const response = await fetch(GOOGLE_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Erro na API do Google (Avaliação de Resposta):", errorBody);
      return NextResponse.json(
        { error: `Falha na comunicação com a API do Google para avaliação. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const evaluationRawText = data.candidates[0]?.content.parts[0]?.text;
    if (!evaluationRawText) {
      return NextResponse.json({ error: 'Não foi possível obter uma avaliação da IA.' }, { status: 500 });
    }

    const evaluation = JSON.parse(evaluationRawText);
    return NextResponse.json(evaluation);

  } catch (error) {
    console.error("Erro interno no servidor de avaliação:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'A resposta da IA de avaliação não estava em um formato JSON válido.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor de avaliação.' }, { status: 500 });
  }
}
