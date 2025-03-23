// src/scripts/seedDatabase.js
require('dotenv').config();
const faker = require('faker');
const { getDatabase } = require('../config/database');

// Configuração local para o português brasileiro
faker.locale = 'pt_BR';

// Função para gerar um ID de cliente com o prefixo 'CLI'
const gerarClienteId = () => `CLI${faker.datatype.number({ min: 10000, max: 99999 })}`;

// Função para gerar um CPF válido (simplificada, não valida o algoritmo)
const gerarCPF = () => {
  const num1 = faker.datatype.number({ min: 100, max: 999 });
  const num2 = faker.datatype.number({ min: 100, max: 999 });
  const num3 = faker.datatype.number({ min: 100, max: 999 });
  const dig = faker.datatype.number({ min: 10, max: 99 });
  return `${num1}.${num2}.${num3}-${dig}`;
};

async function seedDatabase() {
  console.log('Iniciando inserção de dados de teste...');
  
  const db = getDatabase();
  
  try {
    // Verifica se já existem dados
    const clientesCount = await db('clientes').count('id as count').first();
    
    if (parseInt(clientesCount.count) > 0) {
      console.log('Banco de dados já possui dados. Pulando inserção...');
      await db.destroy();
      return;
    }
    
    // Array para armazenar os IDs dos clientes
    const clientesIds = [];
    
    // Dados para a tabela clientes
    const clientes = [];
    for (let i = 0; i < 50; i++) {
      const clienteId = gerarClienteId();
      clientesIds.push(clienteId);
      
      clientes.push({
        id: clienteId,
        nome: faker.name.findName(),
        idade: faker.datatype.number({ min: 18, max: 75 }),
        sexo: faker.random.arrayElement(['M', 'F', 'OUTRO']),
        renda_mensal: parseFloat(faker.finance.amount(1000, 15000, 2)),
        email: faker.internet.email(),
        telefone: faker.phone.phoneNumber(),
        endereco: faker.address.streetAddress(),
        cidade: faker.address.city(),
        estado: faker.address.stateAbbr(),
        cep: faker.address.zipCode('#####-###'),
        cpf: gerarCPF()
      });
    }
    
    // Dados para a tabela bureau_credito
    const bureauCredito = clientesIds.map(clienteId => ({
      cliente_id: clienteId,
      score: faker.datatype.number({ min: 300, max: 900 }),
      ultima_consulta: faker.date.past(1),
      status: faker.random.arrayElement(['REGULAR', 'IRREGULAR', 'PENDENTE', 'BLOQUEADO']),
      total_dividas: faker.datatype.number({ min: 0, max: 10 }),
      valor_dividas: parseFloat(faker.finance.amount(0, 50000, 2)),
      consultas_recentes: faker.datatype.number({ min: 0, max: 15 })
    }));
    
    // Dados para a tabela dados_bancarios
    const dadosBancarios = clientesIds.map(clienteId => ({
      cliente_id: clienteId,
      possui_conta: true,
      saldo_medio: parseFloat(faker.finance.amount(0, 30000, 2)),
      ultima_movimentacao: faker.date.recent(30),
      status: faker.random.arrayElement(['ATIVO', 'INATIVO', 'BLOQUEADO']),
      tempo_relacionamento_meses: faker.datatype.number({ min: 1, max: 120 }),
      quantidade_produtos: faker.datatype.number({ min: 1, max: 5 })
    }));
    
    // Inserir dados no banco
    console.log('Inserindo clientes...');
    await db('clientes').insert(clientes);
    
    console.log('Inserindo dados de bureau de crédito...');
    await db('bureau_credito').insert(bureauCredito);
    
    console.log('Inserindo dados bancários...');
    await db('dados_bancarios').insert(dadosBancarios);
    
    console.log('Dados de teste inseridos com sucesso!');
    
    // Fecha a conexão
    await db.destroy();
  } catch (error) {
    console.error('Erro ao inserir dados de teste:', error);
    await db.destroy();
    process.exit(1);
  }
}

// Executa o seed
seedDatabase();