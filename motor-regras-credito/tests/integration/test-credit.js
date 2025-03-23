// test-credit.js
require('dotenv').config();
const { getDatabase } = require('./src/config/database');

async function testCredit() {
  console.log('Iniciando teste de solicitação de crédito...');
  
  try {
    // Conectar ao banco de dados
    const db = getDatabase();
    
    // Buscar um cliente aleatório para teste
    const cliente = await db('clientes')
      .select('id', 'nome', 'idade', 'renda_mensal')
      .orderByRaw('RANDOM()')
      .first();
    
    if (!cliente) {
      throw new Error('Nenhum cliente encontrado no banco de dados');
    }
    
    console.log('Cliente selecionado para teste:');
    console.log(cliente);
    
    // Calcular valor de crédito para teste (6x a renda mensal)
    const valorCredito = cliente.renda_mensal * 6;
    
    // Buscar dados do bureau e open banking para referência
    const dadosBureau = await db('bureau_credito')
      .where('cliente_id', cliente.id)
      .first();
    
    const dadosBancarios = await db('dados_bancarios')
      .where('cliente_id', cliente.id)
      .first();
    
    console.log('\nDados do Bureau de Crédito:');
    console.log(dadosBureau);
    
    console.log('\nDados Bancários:');
    console.log(dadosBancarios);
    
    console.log(`\nValor de crédito a ser solicitado: R$ ${valorCredito.toFixed(2)}`);
    
    console.log('\nPara testar esta solicitação, execute o seguinte comando curl:');
    console.log(`curl -X POST http://localhost:3000/api/credito/analisar \\
  -H "Content-Type: application/json" \\
  -d '{
    "clienteId": "${cliente.id}",
    "valorCredito": ${valorCredito.toFixed(2)},
    "parametrosAdicionais": {
      "prazo": 36,
      "finalidade": "PESSOAL"
    }
  }'`);
    
    // Fechar conexão com o banco
    await db.destroy();
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar o teste
testCredit();