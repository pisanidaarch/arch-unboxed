// tests/integration/test-ia.js
require('dotenv').config();
const axios = require('axios');

async function testIA() {
  console.log('Testando integração com a IA...');
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
    
    console.log('Enviando dados para análise da IA...');
    
    // Formatar a mensagem para a API de IA
    const mensagem = `O usuário irá informar um json com informações do cenário de crédito como o exemplo abaixo: 
${JSON.stringify(cenarioTeste, null, 2)}

A sua missão será determinar se devemos ou não aprovar o crédito solicitado pelo usuário no json ("valorCredito") com base nas informações históricas. Você deve retornar somente os números 0,1 ou 2 sendo:
0: Se for no minimo 80% de certeza de que você não deveria aprovar;
1: Se for no mínimo 80% de certeza de que você deveria aprovar;
2: Para todos os demais cenários, devido a necessitar de aprovação manual.
IMPORTANT: you must return only the number: 0 or 1 or 2;`;

    const startTime = Date.now();
    
    // Chamar a API de IA
    console.log('Chamando a API de IA...');
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
            role: "user",
            content: mensagem
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
    const conteudoResposta = response.data.choices && 
                            response.data.choices[0] && 
                            response.data.choices[0].message ? 
                            response.data.choices[0].message.content : null;
    
    if (!conteudoResposta) {
      throw new Error('Resposta da IA não contém conteúdo válido');
    }
    
    console.log('\nResposta bruta da IA:');
    console.log(conteudoResposta);
    
    // Interpretar a resposta (0, 1 ou 2)
    const respostaLimpa = conteudoResposta.trim();
    const respostaNumero = parseInt(respostaLimpa);
    
    if (isNaN(respostaNumero)) {
      console.log('AVISO: A resposta não é um número válido!');
    } else {
      console.log('\nCódigo de resposta interpretado:', respostaNumero);
      
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
        default:
          console.log('Interpretação: Código desconhecido!');
      }
    }
    
    console.log('\nTeste de integração com IA concluído com sucesso!');
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