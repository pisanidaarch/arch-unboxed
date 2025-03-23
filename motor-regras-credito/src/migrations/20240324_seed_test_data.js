// Migration para inserir dados de teste
exports.up = function(knex) {
    return Promise.all([
      // Primeiro removemos dados existentes com os mesmos IDs
      knex('bureau_credito').where('cliente_id', 'in', ['CLI12345', 'CLI54321', 'CLI67890']).del(),
      knex('dados_bancarios').where('cliente_id', 'in', ['CLI12345', 'CLI54321', 'CLI67890']).del(),
      knex('clientes').where('id', 'in', ['CLI12345', 'CLI54321', 'CLI67890']).del()
    ])
    .then(() => {
      // Inserir clientes de teste
      return knex('clientes').insert([
        {
          id: 'CLI12345',
          nome: 'Cliente Bom Pagador',
          idade: 35,
          sexo: 'M',
          renda_mensal: 8000.00,
          email: 'bompagador@example.com',
          telefone: '(11) 99999-1111',
          endereco: 'Rua dos Pagamentos, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          cpf: '123.456.789-00',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          id: 'CLI54321',
          nome: 'Cliente Alto Risco',
          idade: 22,
          sexo: 'F',
          renda_mensal: 3000.00,
          email: 'altorisco@example.com',
          telefone: '(11) 99999-2222',
          endereco: 'Rua dos Atrasos, 456',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '04321-765',
          cpf: '987.654.321-00',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          id: 'CLI67890',
          nome: 'Cliente Análise Manual',
          idade: 45,
          sexo: 'M',
          renda_mensal: 12000.00,
          email: 'analisemanual@example.com',
          telefone: '(11) 99999-3333',
          endereco: 'Rua das Exceções, 789',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '06789-012',
          cpf: '456.789.123-00',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    })
    .then(() => {
      // Inserir dados de bureau de crédito
      return knex('bureau_credito').insert([
        {
          cliente_id: 'CLI12345',
          score: 850,      // Score alto (bom)
          ultima_consulta: knex.fn.now(),
          status: 'REGULAR',
          total_dividas: 1,
          valor_dividas: 5000.00,
          consultas_recentes: 2
        },
        {
          cliente_id: 'CLI54321',
          score: 450,      // Score baixo (ruim)
          ultima_consulta: knex.fn.now(),
          status: 'IRREGULAR',
          total_dividas: 5,
          valor_dividas: 25000.00,
          consultas_recentes: 8
        },
        {
          cliente_id: 'CLI67890',
          score: 650,      // Score médio
          ultima_consulta: knex.fn.now(),
          status: 'REGULAR',
          total_dividas: 3,
          valor_dividas: 15000.00,
          consultas_recentes: 4
        }
      ]);
    })
    .then(() => {
      // Inserir dados bancários
      return knex('dados_bancarios').insert([
        {
          cliente_id: 'CLI12345',
          possui_conta: true,
          saldo_medio: 5000.00,
          ultima_movimentacao: knex.fn.now(),
          status: 'ATIVO',
          tempo_relacionamento_meses: 60,
          quantidade_produtos: 3
        },
        {
          cliente_id: 'CLI54321',
          possui_conta: true,
          saldo_medio: 500.00,
          ultima_movimentacao: knex.fn.now(),
          status: 'ATIVO',
          tempo_relacionamento_meses: 12,
          quantidade_produtos: 1
        },
        {
          cliente_id: 'CLI67890',
          possui_conta: true,
          saldo_medio: 8000.00,
          ultima_movimentacao: knex.fn.now(),
          status: 'ATIVO',
          tempo_relacionamento_meses: 36,
          quantidade_produtos: 4
        }
      ]);
    });
  };
  
  exports.down = function(knex) {
    // Remover dados inseridos
    return Promise.all([
      knex('bureau_credito').where('cliente_id', 'in', ['CLI12345', 'CLI54321', 'CLI67890']).del(),
      knex('dados_bancarios').where('cliente_id', 'in', ['CLI12345', 'CLI54321', 'CLI67890']).del(),
      knex('clientes').where('id', 'in', ['CLI12345', 'CLI54321', 'CLI67890']).del()
    ]);
  };