// tests/integration/test-ia.js
require('dotenv').config();
const axios = require('axios');

async function testIA() {
  console.log('Testando integração com a IA (versão melhorada)...');
  console.log('==============================================');
  
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
    
    // Formatar mensagem para forçar uma resposta em formato JSON
    const systemPrompt = `Você é um analisador de crédito que responde APENAS em formato JSON. NUNCA explique seu raciocínio. NUNCA use texto fora do JSON.`;
    
    const userPrompt = `Analise os dados do cenário de crédito abaixo e retorne APENAS um objeto JSON com a seguinte estrutura:
{
  "code": 0 OU 1 OU 2, // 0=Rejeitar, 1=Aprovar, 2=Análise Manual
  "confidence": número entre 0 e 1 // sua confiança na decisão
}

IMPORTANTE: 
- Você DEVE retornar APENAS o objeto JSON acima, sem nenhum texto explicativo adicional.
- Não inclua markdown, comentários ou qualquer outro texto.
- Use code=0 para rejeitar crédito com pelo menos 80% de certeza
- Use code=1 para aprovar crédito com pelo menos 80% de certeza
- Use code=2 para solicitar análise manual em casos de incerteza

DADOS DO CENÁRIO:
${JSON.stringify(cenarioTeste, null, 2)}

LEMBRE-SE: Responda APENAS com o objeto JSON no formato especificado.`;

    const startTime = Date.now();
    
    // Chamar a API de IA com solicitação de output em JSON
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
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
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
    
    // Tentar extrair o JSON da resposta
    try {
      // Remover possíveis formatações extras (código, markdown, etc)
      let jsonString = conteudoResposta;
      if (jsonString.includes('```json')) {
        jsonString = jsonString.split('```json')[1].split('```')[0].trim();
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.split('```')[1].split('```')[0].trim();
      }
      
      const resultadoJSON = JSON.parse(jsonString);
      console.log('\nJSON extraído com sucesso:');
      console.log(JSON.stringify(resultadoJSON, null, 2));
      
      if (resultadoJSON.code !== undefined) {
        console.log('\nCódigo de resposta interpretado:', resultadoJSON.code);
        
        switch (resultadoJSON.code) {
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
        
        if (resultadoJSON.confidence !== undefined) {
          console.log(`Confiança: ${resultadoJSON.confidence * 100}%`);
        }
      } else {
        console.error('JSON não contém o campo "code" esperado');
      }
    } catch (jsonError) {
      console.error('\nErro ao extrair JSON da resposta:', jsonError.message);
      console.log('Tentando extrair número diretamente...');
      
      // Fallback: tentar extrair um número do conteúdo (mesmo se tiver texto)
      const numerosEncontrados = conteudoResposta.match(/[0-2]/g);
      let respostaNumero;
      
      if (numerosEncontrados && numerosEncontrados.length > 0) {
        // Usar o primeiro número encontrado entre 0 e 2
        respostaNumero = parseInt(numerosEncontrados[0]);
        console.log('\nNúmero extraído da resposta:', respostaNumero);
        
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
      } else {
        console.error('Não foi possível extrair um número válido da resposta');
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