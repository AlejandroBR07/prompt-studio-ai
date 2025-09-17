# Prompt Studio AI

Uma ferramenta completa para otimização de prompts de IA e geração automática de automações N8N, desenvolvida com Next.js, TypeScript e Tailwind CSS.

## ✨ Funcionalidades

### 🎯 **Dify Prompt Studio**
- Análise inteligente de prompts usando Google Gemini AI
- Avaliação de clareza, persona, regras e estrutura
- Geração automática de testes de estresse
- Sistema de pontuação visual com animações

### 🤖 **Assistente N8N**
- Geração automática de workflows N8N a partir de descrições em português
- Sanitização inteligente do JSON para compatibilidade total
- Suporte completo aos tipos de nós N8N
- Visualização de nós com ícones dinâmicos

### 🔍 **Dify QA Tester**
- Testes automatizados de qualidade para prompts
- Validação de respostas ideais vs. respostas reais
- Interface intuitiva para testes de estresse
- Relatórios detalhados de performance

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 1.5 Flash
- **APIs**: RESTful APIs para análise e geração
- **Deployment**: Pronto para Vercel/Netlify

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Chave da API do Google AI (Gemini)

## 🛠️ Instalação e Configuração

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USERNAME/prompt-studio-ai.git
   cd prompt-studio-ai
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   GOOGLE_API_KEY=sua_chave_api_aqui
   ```

4. **Execute o projeto:**
   ```bash
   npm run dev
   ```

5. **Acesse:** `http://localhost:3000`

## 📁 Estrutura do Projeto

```
prompt-studio-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/          # Análise de prompts
│   │   │   ├── dify/             # Integração Dify
│   │   │   ├── evaluate-response/# Avaliação de respostas
│   │   │   └── n8n/              # Geração N8N
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # Componente principal
│   └── types/
│       └── n8n.d.ts              # Tipos TypeScript N8N
├── public/                       # Assets estáticos
├── commit.bat                    # Script de commit automatizado
├── tailwind.config.ts
└── README.md
```

## 🎨 Funcionalidades Técnicas

### Tratamento de Erros
- Retry automático com backoff exponencial para rate limits
- Sanitização de JSON N8N para evitar erros de importação
- Mensagens de erro amigáveis ao usuário

### UI/UX Moderna
- Design responsivo com Tailwind CSS
- Animações suaves e transições
- Tema dark otimizado
- Componentes reutilizáveis

### Performance
- Next.js App Router para otimização
- API Routes eficientes
- Cache inteligente de respostas

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## 📝 Como Usar

### 1. Análise de Prompt
1. Acesse a aba "✨ Dify Prompt Studio"
2. Cole seu prompt no campo de texto
3. Clique em "Analisar Prompt"
4. Visualize a pontuação e sugestões de melhoria

### 2. Geração N8N
1. Acesse a aba "🧩 Assistente N8N"
2. Descreva sua automação em português
3. Clique em "Gerar Workflow"
4. Baixe o JSON e importe no N8N

### 3. QA Tester
1. Acesse a aba "🔍 Dify QA Tester"
2. Cole seu prompt e execute os testes
3. Analise os resultados dos testes de estresse

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- Google AI por fornecer a API Gemini
- N8N pela plataforma de automação
- Dify pela inspiração no design
- Comunidade Open Source

---

**Desenvolvido com 💙 por Gemini**
