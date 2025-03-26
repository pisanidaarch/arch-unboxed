// tests/integration/test-ia-new.js
require('dotenv').config();
const IAAdapter = require('../../src/adapter/IAAdapter');
const Cenario = require('../../src/entity/Cenario');

async function testIA() {
  console.log('Testando integração com a IA (nova versão)...');
  console.log('==========================================');
  
  try {
    // Criar instância do adaptador
    const iaAdapter = new IAAdapter({
      timeout: 10000 // Timeout maior para testes
    });
    
    // Criar um cenário de teste completo
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    
    // Adicionar dados do cliente
    cenario.adicionarDados('DADOS_CLIENTE', {
      nome: 'Cliente de Teste',
      idade: 35,
      sexo: 'M',
      rendaMensal: 8000,
      email: 'teste@example.com',
      telefone: '(11) 99999-1111',
      endereco: 'Rua de Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
      cpf: '123.456.789-00'
    });
    
    // Adicionar dados do bureau
    cenario.adicionarDados('BUREAU_CREDITO', {
      score: 750,
      ultimaConsulta: new Date(),
      status: 'REGULAR',
      totalDividas: 1,
      valorDividas: 5000,
      consultasRecentes: 2
    });
    
    // Adicionar dados de open banking
    cenario.adicionarDados('OPEN_BANKING', {
      possuiConta: true,
      saldoMedio: 5000,
      ultimaMovimentacao: new Date(),
      status: 'ATIVO',
      tempoRelacionamentoMeses: 36,
      quantidadeProdutos: 3
    });
    
    // Adicionar alguns resultados de regras
    cenario.adicionarResultadoAvaliacao('IDADE_MINIMA', true, 'Idade mínima de 18 anos');
    cenario.adicionarResultadoAvaliacao('SCORE_MINIMO', true, 'Score mínimo de 500');
    
    // Log dos dados que serão enviados para a IA
    console.log('Dados formatados para a IA:');
    const jsonParaIA = cenario.toJsonForIA();
    console.log(JSON.stringify(jsonParaIA, null, 2));
    
    console.log('\nEnviando dados para análise da IA...');
    const startTime = Date.now();
    
    // Chamar o adaptador para avaliar o crédito
    const resultadoIA = await iaAdapter.avaliarCredito(cenario);
    
    const endTime = Date.now();
    console.log(`Resposta recebida em ${(endTime - startTime)/1000} segundos`);
    
    console.log('\nResultado da IA:');
    console.log('- Aprovado:', resultadoIA.aprovado);
    console.log('- Justificativa:', resultadoIA.justificativa);
    console.log('- Confiança:', resultadoIA.confianca);
    console.log('- Análise Manual:', resultadoIA.analiseManual);
    
    console.log('\nTeste completo! Verificando formatação dos dados...');
    
    // Simular cenários para cada código de resposta
    console.log('\nSimulando interpretação de códigos:');
    
    // Código 0: Reprovação
    const resposta0 = {choices: [{message: {content: '0'}}]};
    const resultado0 = iaAdapter.processarRespostaIA(resposta0);
    console.log('- Código 0 (Reprovação):', resultado0);
    
    // Código 1: Aprovação
    const resposta1 = {choices: [{message: {content: '1'}}]};
    const resultado1 = iaAdapter.processarRespostaIA(resposta1);
    console.log('- Código 1 (Aprovação):', resultado1);
    
    // Código 2: Análise manual
    const resposta2 = {choices: [{message: {content: '2'}}]};
    const resultado2 = iaAdapter.processarRespostaIA(resposta2);
    console.log('- Código 2 (Análise Manual):', resultado2);
    
    console.log('\nTeste de integração com IA concluído com sucesso!');
  } catch (error) {
    console.error('\nErro durante o teste de integração com IA:', error);
  }
}

// Executar o teste
testIA();