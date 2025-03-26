// tests/test-ia-direto.js
require('dotenv').config();
const axios = require('axios');

async function testIA() {
  console.log('Testando comunicação direta com a IA...');
  console.log('==========================');
  
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
    
    // Mensagem para a API com instrução explícita de responder apenas com o número
    const mensagemUser = `IMPORTANTE: Você DEVE retornar APENAS UM dos seguintes números:
0 = Rejeitar crédito (80%+ de certeza)
1 = Aprovar crédito (80%+ de certeza) 
2 = Solicitar análise manual (incerteza)

Sua resposta completa deve ser apenas o número: 0 ou 1 ou 2, sem nenhum texto adicional.

Dados para análise:
${JSON.stringify(cenarioTeste, null, 2)}

Responda apenas com o número 0, 1 ou 2. Qualquer outra resposta será considerada um erro.`;

    console.log('Enviando dados para análise da IA...');
    const startTime = Date.now();
    
    // Chamar a API de IA com system prompt explícito
    const response = await axios({
      method: 'post',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`
      },
      data: {
        messages: [
          {
            role: "system",
            content: "Você é um analisador de crédito que responde APENAS COM UM ÚNICO NÚMERO (0, 1 ou 2) sem explicações adicionais. IMPORTANTE: Sua resposta completa deve ser apenas o número, sem texto adicional."
          },
          {
            role: "user",
            content: mensagemUser
          }
        ],
        stream: false,
        include_functions_info: false,
        include_retrieval_info: false,
        include_guardrails_info: false
      },
      timeout: 10000
    });

    const endTime = Date.now();
    console.log(`Resposta recebida em ${(endTime - startTime)/1000} segundos`);
    
    // Extrair resposta da IA
    const conteudoResposta = response.data.choices?.[0]?.message?.content;
    
    if (!conteudoResposta) {
      throw new Error('Resposta da IA não contém conteúdo válido');
    }
    
    console.log('\nResposta bruta da IA:');
    console.log(conteudoResposta);
    
    // Tentar extrair um número do conteúdo (mesmo se tiver texto)
    const numerosEncontrados = conteudoResposta.match(/[0-2]/g);
    let respostaNumero;
    
    if (numerosEncontrados && numerosEncontrados.length > 0) {
      // Usar o primeiro número encontrado entre 0 e 2
      respostaNumero = parseInt(numerosEncontrados[0]);
      console.log('\nNúmero extraído da resposta:', respostaNumero);
    } else {
      // Tentar usar toda a resposta como um número
      respostaNumero = parseInt(conteudoResposta.trim());
      console.log('\nNúmero da resposta completa:', respostaNumero);
    }
    
    // Verificar se é um número válido (0, 1 ou 2)
    if (isNaN(respostaNumero) || ![0, 1, 2].includes(respostaNumero)) {
      console.error('ERRO: Resposta da IA não contém um número válido (0, 1 ou 2)');
    } else {
      console.log('\nCódigo de resposta válido:', respostaNumero);
      
      switch (respostaNumero) {
        case 0:
          console.log('Interpretação: Crédito REJEITADO com alta confiança');
          break;
        case 1:
          console.log('Interpretação: Crédito APROVADO com alta confiança');
          break;
        case 2:
          console.log('Interpretação: Crédito encaminhado para ANÁLISE MANUAL');
          break;
      }
    }
    
    console.log('\nTeste de integração com IA concluído!');
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