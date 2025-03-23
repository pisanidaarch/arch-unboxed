// tests/integration/test-api.js
require('dotenv').config();
const axios = require('axios');
const { getDatabase } = require('./src/config/database');

// Configuração do teste
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Função para aguardar um determinado tempo
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('Iniciando testes da API...');
  console.log('==========================');
  
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  try {
    // Conectar ao banco de dados
    const db = getDatabase();

    // Teste 1: Verificar status da API
    try {
      console.log('\nTeste 1: Verificando status da API...');
      const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
      
      if (response.status === 200 && response.data.status === 'ok') {
        console.log('✅ API está disponível');
        testResults.passed++;
      } else {
        console.error('❌ API não está respondendo corretamente');
        testResults.failed++;
      }
      testResults.total++;
      testResults.details.push({
        name: 'Verificar status da API',
        status: response.status === 200 && response.data.status === 'ok' ? 'PASS' : 'FAIL'
      });
    } catch (error) {
      console.error('❌ Erro ao verificar status da API:', error.message);
      testResults.failed++;
      testResults.total++;
      testResults.details.push({
        name: 'Verificar status da API',
        status: 'FAIL',
        error: error.message
      });
    }

    // Teste 2: Listar clientes de exemplo
    let clientId;
    try {
      console.log('\nTeste 2: Obtendo clientes de exemplo...');
      const response = await axios.get(`${API_URL}/clientes/exemplo/lista`);
      
      if (response.status === 200 && response.data.clientes.length > 0) {
        console.log(`✅ ${response.data.clientes.length} clientes obtidos`);
        clientId = response.data.clientes[0].id;
        console.log(`   Primeiro cliente: ${response.data.clientes[0].nome} (ID: ${clientId})`);
        testResults.passed++;
      } else {
        console.error('❌ Nenhum cliente encontrado');
        testResults.failed++;
      }
      testResults.total++;
      testResults.details.push({
        name: 'Obter clientes de exemplo',
        status: response.status === 200 && response.data.clientes.length > 0 ? 'PASS' : 'FAIL'
      });
    } catch (error) {
      console.error('❌ Erro ao obter clientes de exemplo:', error.message);
      testResults.failed++;
      testResults.total++;
      testResults.details.push({
        name: 'Obter clientes de exemplo',
        status: 'FAIL',
        error: error.message
      });
      
      // Se não conseguimos obter clientes de exemplo, vamos buscar direto no banco de dados
      try {
        const cliente = await db('clientes').first();
        if (cliente) {
          clientId = cliente.id;
          console.log(`   Usando cliente do banco de dados: ${cliente.nome} (ID: ${clientId})`);
        }
      } catch (dbError) {
        console.error('   Não foi possível obter cliente do banco de dados:', dbError.message);
      }
    }

    // Se não encontramos um cliente, não podemos continuar os testes
    if (!clientId) {
      throw new Error('Não foi possível obter um ID de cliente para testes. Abortando...');
    }

    // Teste 3: Detalhar cliente
    try {
      console.log(`\nTeste 3: Detalhando cliente ${clientId}...`);
      const response = await axios.get(`${API_URL}/clientes/${clientId}`);
      
      if (response.status === 200 && response.data.id === clientId) {
        console.log(`✅ Cliente ${response.data.nome} detalhado com sucesso`);
        console.log(`   Idade: ${response.data.idade}, Renda: R$ ${response.data.rendaMensal}`);
        testResults.passed++;
      } else {
        console.error('❌ Falha ao detalhar cliente');
        testResults.failed++;
      }
      testResults.total++;
      testResults.details.push({
        name: 'Detalhar cliente',
        status: response.status === 200 && response.data.id === clientId ? 'PASS' : 'FAIL'
      });
    } catch (error) {
      console.error('❌ Erro ao detalhar cliente:', error.message);
      testResults.failed++;
      testResults.total++;
      testResults.details.push({
        name: 'Detalhar cliente',
        status: 'FAIL',
        error: error.message
      });
    }

    // Teste 4: Solicitar análise de crédito
    let cenarioId;
    try {
      // Buscar dados do cliente para calcular um valor de crédito adequado
      const cliente = await db('clientes').where('id', clientId).first();
      const valorCredito = cliente.renda_mensal * 5; // 5x a renda mensal

      console.log(`\nTeste 4: Solicitando análise de crédito para cliente ${clientId}...`);
      console.log(`   Valor do crédito: R$ ${valorCredito.toFixed(2)}`);
      
      const response = await axios.post(`${API_URL}/credito/analisar`, {
        clienteId,
        valorCredito,
        parametrosAdicionais: {
          prazo: 36,
          finalidade: 'TESTE_AUTOMATIZADO'
        }
      });
      
      if (response.status === 200 && response.data.idCenario) {
        cenarioId = response.data.idCenario;
        console.log(`✅ Análise realizada com sucesso. Status: ${response.data.status}`);
        console.log(`   ID do cenário: ${cenarioId}`);
        testResults.passed++;
      } else {
        console.error('❌ Falha ao solicitar análise de crédito');
        testResults.failed++;
      }
      testResults.total++;
      testResults.details.push({
        name: 'Solicitar análise de crédito',
        status: response.status === 200 && response.data.idCenario ? 'PASS' : 'FAIL'
      });
    } catch (error) {
      console.error('❌ Erro ao solicitar análise de crédito:', error.message);
      testResults.failed++;
      testResults.total++;
      testResults.details.push({
        name: 'Solicitar análise de crédito',
        status: 'FAIL',
        error: error.message
      });
    }

    // Aguardar um pouco para o banco de dados processar
    await sleep(1000);

    // Teste 5: Consultar cenário
    if (cenarioId) {
      try {
        console.log(`\nTeste 5: Consultando cenário ${cenarioId}...`);
        const response = await axios.get(`${API_URL}/credito/cenario/${cenarioId}`);
        
        if (response.status === 200 && response.data.id === cenarioId) {
          console.log(`✅ Cenário consultado com sucesso. Status: ${response.data.status}`);
          console.log(`   Cliente: ${response.data.clienteId}, Valor: R$ ${response.data.valorCredito}`);
          testResults.passed++;
        } else {
          console.error('❌ Falha ao consultar cenário');
          testResults.failed++;
        }
        testResults.total++;
        testResults.details.push({
          name: 'Consultar cenário',
          status: response.status === 200 && response.data.id === cenarioId ? 'PASS' : 'FAIL'
        });
      } catch (error) {
        console.error('❌ Erro ao consultar cenário:', error.message);
        testResults.failed++;
        testResults.total++;
        testResults.details.push({
          name: 'Consultar cenário',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Teste 6: Consultar histórico do cliente
    try {
      console.log(`\nTeste 6: Consultando histórico do cliente ${clientId}...`);
      const response = await axios.get(`${API_URL}/credito/historico/${clientId}`);
      
      if (response.status === 200 && response.data.clienteId === clientId) {
        console.log(`✅ Histórico consultado com sucesso. Total de análises: ${response.data.totalAnalises}`);
        testResults.passed++;
      } else {
        console.error('❌ Falha ao consultar histórico do cliente');
        testResults.failed++;
      }
      testResults.total++;
      testResults.details.push({
        name: 'Consultar histórico do cliente',
        status: response.status === 200 && response.data.clienteId === clientId ? 'PASS' : 'FAIL'
      });
    } catch (error) {
      console.error('❌ Erro ao consultar histórico do cliente:', error.message);
      testResults.failed++;
      testResults.total++;
      testResults.details.push({
        name: 'Consultar histórico do cliente',
        status: 'FAIL',
        error: error.message
      });
    }

    // Fechar conexão com o banco
    await db.destroy();

  } catch (error) {
    console.error('\n❌ Erro fatal durante os testes:', error.message);
  }

  // Exibir resumo dos testes
  console.log('\n==========================');
  console.log('Resumo dos testes:');
  console.log(`Total de testes: ${testResults.total}`);
  console.log(`Testes bem-sucedidos: ${testResults.passed}`);
  console.log(`Testes falhos: ${testResults.failed}`);
  console.log('==========================');
  
  // Detalhar resultados
  console.log('\nDetalhes dos testes:');
  testResults.details.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`   Erro: ${test.error}`);
    }
  });
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});