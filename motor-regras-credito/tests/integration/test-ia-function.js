// tests/integration/test-ia-function.js
require('dotenv').config();
const axios = require('axios');

async function testIA() {
  console.log('Testando integração com a IA (usando Function Calling)...');
  console.log('====================================================');
  
  try {
    // Configuração do endpoint da IA
    const endpoint = process.env.IA_ENDPOINT || 'https://agent-fwsknwjtwgows7bbq34wgyka-lacbb.ondigitalocean.app/api/v1/chat/completions';
    const accessKey = process.env.IA_ACCESS_KEY || 'tLNu967VSaTZkiWzvNJvAX5a4cnN7ilb';
    
    console.log('Usando endpoint:', endpoint);
    
    // Criar cenário de teste
    const cenarioTeste = {
      id: 'cen_teste123',
      clienteId: 'CLI12345',
      valorCredito: '10000.00',
      dataCriacao: new Date().toISOString(),
      cliente: {
        nome: 'Cliente Teste',
        idade: 35,
        sexo: 'M',
        rendaMensal: 8000,
        email: 'teste@example.com',
        telefone: '(11) 99999-1111',
        endereco: 'Rua de Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567'
      },
      bureau: {
        score: 750,
        status: 'REGULAR',
        totalDividas: 1,
        valorDividas: 5000,
        consultasRecentes: 2
      },
      openBanking: {
        possuiConta: true,
        saldoMedio: 5000,
        status: 'ATIVO',
        tempoRelacionamentoMeses: 36,
        quantidadeProdutos: 3
      },
      resultadosAvaliacao: [
        {
          regra: 'IDADE_MINIMA',
          resultado: true,
          descricao: 'Idade mínima de 18 anos'
        },
        {
          regra: 'SCORE_MINIMO',
          resultado: true,
          descricao: 'Score mínimo de 500'
        }
      ]
    };
    
    // Definição de ferramenta para função de aprovação de crédito
    const tools = [
      {
        type: "function",
        function: {
          name: "creditDecision",
          description: "Decide if a credit application should be approved, rejected, or sent for manual review",
          parameters: {
            type: "object",
            properties: {
              decision: {
                type: "string",
                enum: ["APPROVE", "REJECT", "MANUAL_REVIEW"],
                description: "The decision for the credit application"
              },
              confidence: {
                type: "number",
                description: "Confidence level in the decision (0-1)",
                minimum: 0,
                maximum: 1
              },
              justification: {
                type: "string",
                description: "Brief explanation for the decision"
              }
            },
            required: ["decision", "confidence"]
          }
        }
      }
    ];
    
    // Mensagem para a API com instrução de usar a função
    const mensagemUser = `Analise este cenário de crédito e use a função creditDecision para determinar se o crédito deve ser aprovado, rejeitado ou enviado para análise manual:

${JSON.stringify(cenarioTeste, null, 2)}

Considere que:
1. Se o cliente tiver alto score (>700) e renda mensal suficiente para cobrir o crédito, geralmente é uma aprovação
2. Se o comprometimento da renda (assumindo parcelas de 10% do valor total do crédito por mês) for maior que 30%, considere rejeitar
3. Se houver dados conflitantes ou incompletos, envie para análise manual
4. Não responda com texto, APENAS chame a função`;

    const startTime = Date.now();
    
    // Chamar a API de IA com tools
    console.log('Chamando a API de IA com Function Calling...');
    const response = await axios({
      method: 'post',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`
      },
      data: {
        model: "anthropic.claude-3-haiku-20240307", // Certifique-se de que o modelo seja compatível com function calling
        messages: [
          {
            role: "user",
            content: mensagemUser
          }
        ],
        tools: tools,
        tool_choice: { type: "auto" },
        stream: false,
        max_tokens: 1024
      },
      timeout: 10000
    });

    const endTime = Date.now();
    console.log(`Resposta recebida em ${(endTime - startTime)/1000} segundos`);
    
    console.log('\nResposta completa da IA:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Extrair resultado da função, se disponível
    const toolCalls = response.data.tool_calls || [];
    
    if (toolCalls.length > 0 && toolCalls[0].function) {
      const functionCall = toolCalls[0].function;
      console.log('\nChamada de função detectada:');
      console.log(`Função: ${functionCall.name}`);
      
      try {
        const args = JSON.parse(functionCall.arguments);
        console.log('Argumentos:');
        console.log(JSON.stringify(args, null, 2));
        
        // Interpretar a decisão
        if (args.decision) {
          console.log('\nDecisão de crédito:');
          switch(args.decision) {
            case 'APPROVE':
              console.log('✅ APROVADO');
              break;
            case 'REJECT':
              console.log('❌ REJEITADO');
              break;
            case 'MANUAL_REVIEW':
              console.log('👤 ANÁLISE MANUAL');
              break;
            default:
              console.log(`Decisão desconhecida: ${args.decision}`);
          }
          
          if (args.confidence) {
            console.log(`Confiança: ${args.confidence * 100}%`);
          }
          
          if (args.justification) {
            console.log(`Justificativa: ${args.justification}`);
          }
        }
      } catch (e) {
        console.error('Erro ao processar argumentos da função:', e.message);
      }
    } else {
      console.log('\nNenhuma chamada de função detectada na resposta.');
      
      // Verificar se há uma resposta de texto
      if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        console.log('\nConteúdo da resposta:');
        console.log(response.data.choices[0].message.content);
      }
    }
    
    console.log('\nTeste de integração com IA (Function Calling) concluído!');
  } catch (error) {
    console.error('\nErro durante o teste de integração com IA:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Executar o teste
testIA();