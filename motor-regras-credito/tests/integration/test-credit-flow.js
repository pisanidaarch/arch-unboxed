#!/usr/bin/env node
// tests/integration/test-credit-flow.js
require('dotenv').config();
const axios = require('axios');

// URL base da API
const API_URL = 'http://localhost:3000/api';

/**
 * Script para testar o fluxo completo de aprovação de crédito
 * incluindo a integração com IA
 */
async function testCreditFlow() {
  console.log('Testando fluxo de aprovação de crédito com IA...');
  console.log('===============================================');
  
  try {
    // Passo 1: Verificar se a API está no ar
    console.log('1. Verificando status da API...');
    const healthResponse = await axios.get(`${API_URL.replace('/api', '')}/health`);
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   IA Endpoint: ${healthResponse.data.iaEndpoint}`);
    
    // Passo 2: Obter um cliente para teste
    console.log('\n2. Obtendo cliente para teste...');
    const clientesResponse = await axios.get(`${API_URL}/clientes/exemplo/lista`);
    
    if (!clientesResponse.data.clientes || clientesResponse.data.clientes.length === 0) {
      throw new Error('Nenhum cliente disponível para teste');
    }
    
    const cliente = clientesResponse.data.clientes[0];
    console.log(`   Cliente selecionado: ${cliente.nome} (ID: ${cliente.id})`);
    console.log(`   Idade: ${cliente.idade}, Renda: R$ ${cliente.rendaMensal}`);
    
    // Passo 3: Calcular um valor de crédito (6x a renda mensal)
    const valorCredito = cliente.rendaMensal * 6;
    console.log(`\n3. Valor de crédito a ser solicitado: R$ ${valorCredito.toFixed(2)}`);
    
    // Passo 4: Solicitar análise de crédito
    console.log('\n4. Enviando solicitação de análise de crédito...');
    const creditoResponse = await axios.post(`${API_URL}/credito/analisar`, {
      clienteId: cliente.id,
      valorCredito,
      parametrosAdicionais: {
        prazo: 36,
        finalidade: 'TESTE_IA'
      }
    });
    
    console.log(`   Status da análise: ${creditoResponse.data.status}`);
    console.log(`   ID do cenário: ${creditoResponse.data.idCenario}`);
    console.log(`   Mensagem: ${creditoResponse.data.mensagem}`);
    
    // Passo 5: Verificar regras aplicadas
    console.log('\n5. Regras aplicadas:');
    creditoResponse.data.detalhesAvaliacao.forEach((regra, index) => {
      console.log(`   ${index + 1}. ${regra.regra}: ${regra.resultado ? 'APROVADO' : 'REPROVADO'}`);
      console.log(`      ${regra.descricao}`);
    });
    
    // Passo 6: Verificar dados adicionais (conforme o status)
    console.log('\n6. Dados adicionais:');
    if (creditoResponse.data.status === 'APROVADO') {
      console.log('   Crédito aprovado sem restrições');
    } else if (creditoResponse.data.status === 'REPROVADO') {
      console.log('   Motivos de reprovação:');
      if (creditoResponse.data.dadosAdicionais.motivosReprovacao) {
        creditoResponse.data.dadosAdicionais.motivosReprovacao.forEach((motivo, index) => {
          console.log(`      - ${motivo}`);
        });
      }
    } else if (creditoResponse.data.status === 'ANALISE_MANUAL') {
      console.log(`   Motivo: ${creditoResponse.data.dadosAdicionais.motivoAnaliseManual}`);
      console.log(`   Estimativa de tempo: ${creditoResponse.data.dadosAdicionais.estimativaTempo}`);
    }
    
    console.log('\nTeste de fluxo de crédito com IA concluído com sucesso!');
    
  } catch (error) {
    console.error('\nErro durante o teste de fluxo de crédito:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Executar o teste
testCreditFlow();