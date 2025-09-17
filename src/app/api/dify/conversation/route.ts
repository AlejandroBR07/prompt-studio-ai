import { NextResponse } from 'next/server';

const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';

interface DifyRequestBody {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: string;
  user: string;
  conversation_id?: string;
}

export async function POST(request: Request) {
  try {
    // 1. Validar a chave de API do Dify
    if (!process.env.DIFY_API_KEY || process.env.DIFY_API_KEY === 'SUA_CHAVE_API_AQUI') {
      return NextResponse.json(
        { error: 'A chave de API do Dify não foi configurada no servidor.' },
        { status: 500 }
      );
    }

    // 2. Extrair o prompt do usuário (system instruction) e a mensagem (user query)
    const { userPrompt, message, conversation_id, user_id } = await request.json();
    if (!userPrompt || !message) {
      return NextResponse.json({ error: 'Prompt do usuário e/ou mensagem não fornecidos.' }, { status: 400 });
    }

    // 3. Montar o corpo da requisição para a API do Dify
    const requestBody: Record<string, any> = {
      inputs: {}, // Dify expects an inputs object, even if empty
      query: message,
      response_mode: 'blocking', // For a single response, not streaming
      user: user_id || 'default_user', // Dify requires a user ID
      // The userPrompt will be handled by Dify's prompt management, not sent directly in the chat message body
    };

    if (conversation_id) {
      requestBody.conversation_id = conversation_id;
    }

    // 4. Chamar a API do Dify
    const response = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Erro na API do Dify (Simulação de Conversa):", errorBody);
      return NextResponse.json(
        { error: `Falha na comunicação com a API do Dify. Status: ${response.status}. Detalhes: ${errorBody}` },
        { status: response.status }
      );
    }

    // 5. Processar a resposta e retornar para o cliente
    const data = await response.json();
    const aiResponse = data.answer; // Dify's chat message response typically has an 'answer' field
    const new_conversation_id = data.conversation_id; // Capture new conversation ID

    if (!aiResponse) {
      return NextResponse.json({ error: 'Não foi possível obter uma resposta da IA do Dify.' }, { status: 500 });
    }

    return NextResponse.json({ response: aiResponse, conversation_id: new_conversation_id });

  } catch (error) {
    console.error("Erro interno no servidor:", error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}