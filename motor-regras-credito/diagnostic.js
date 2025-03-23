// diagnostic.js

const Cenario = require('./src/entity/Cenario');
const IdadeMinimaMandatoriaSpecification = require('./src/core/specifications/IdadeMinimaMandatoriaSpecification');
const ComprometimentoRendaStrategy = require('./src/core/strategies/ComprometimentoRendaStrategy');

console.log('=== TESTE DE DIAGNÓSTICO DO MOTOR DE REGRAS ===');

// Criar cenário de teste
const cenario = new Cenario();
cenario.clienteId = 'TESTE123';
cenario.valorCredito = 1000;

// Adicionar dados fictícios
cenario.adicionarDados('DADOS_CLIENTE', {
  nome: 'Cliente Teste',
  idade: 30,
  rendaMensal: 5000
});

cenario.adicionarDados('BUREAU_CREDITO', {
  score: 700
});

console.log('\n1. Verificando métodos do objeto Cenario:');
console.log('- getDadosPorTipo:', typeof cenario.getDadosPorTipo === 'function' ? 'OK' : 'FALHA');
console.log('- adicionarResultadoAvaliacao:', typeof cenario.adicionarResultadoAvaliacao === 'function' ? 'OK' : 'FALHA');
console.log('- todosResultadosAprovados:', typeof cenario.todosResultadosAprovados === 'function' ? 'OK' : 'FALHA');

console.log('\n2. Testando especificação IdadeMinimaMandatoria:');
const idadeSpec = new IdadeMinimaMandatoriaSpecification(18);
try {
  const resultadoIdade = idadeSpec.isSatisfiedBy(cenario);
  console.log('- Resultado:', resultadoIdade ? 'APROVADO' : 'REPROVADO');
} catch (error) {
  console.error('- ERRO:', error.message);
  console.error('  Stack:', error.stack);
}

console.log('\n3. Testando estratégia ComprometimentoRenda:');
const rendaStrategy = new ComprometimentoRendaStrategy(30, true);
try {
  const resultadoRenda = rendaStrategy.execute(cenario);
  console.log('- Resultado:', resultadoRenda ? 'APROVADO' : 'REPROVADO');
} catch (error) {
  console.error('- ERRO:', error.message);
  console.error('  Stack:', error.stack);
}

console.log('\n4. Testando cópia de objeto Cenario (simulando o problema):');
try {
  // Esta é uma cópia superficial que não inclui métodos - simulando o problema
  const cenarioCopia = { ...cenario };
  console.log('- getDadosPorTipo existe na cópia?', typeof cenarioCopia.getDadosPorTipo === 'function' ? 'SIM' : 'NÃO');
  
  if (typeof cenarioCopia.getDadosPorTipo !== 'function') {
    console.log('- CONFIRMADO: O problema ocorre porque a cópia superficial não preserva métodos');
  }
  
  // Tentar acessar dados do cliente na cópia
  try {
    const dadosCliente = cenarioCopia.getDadosPorTipo('DADOS_CLIENTE');
    console.log('- Dados do cliente:', dadosCliente);
  } catch (error) {
    console.error('- ERRO ao acessar dados na cópia:', error.message);
  }
} catch (error) {
  console.error('- ERRO no teste de cópia:', error.message);
}

console.log('\n5. Recomendação:');
console.log('Substitua todas as ocorrências de cópias superficiais do objeto Cenario');
console.log('como "{ ...cenario }" para usar o objeto original "cenario" diretamente.');
console.log('Inspecione principalmente:');
console.log('- src/core/chain/ChainOfResponsibility.js');
console.log('- src/core/chain/handlers/RegrasMandatoriasHandler.js');
console.log('- src/core/chain/handlers/RegrasDinamicasHandler.js');
console.log('- src/core/chain/handlers/RequisicaoIAHandler.js');