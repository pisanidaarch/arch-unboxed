// src/migrations/20240323_initial_schema.js

exports.up = function(knex) {
    return knex.schema
      // Tabela de clientes
      .createTable('clientes', function(table) {
        table.string('id').primary();
        table.string('nome').notNullable();
        table.integer('idade').notNullable();
        table.enum('sexo', ['M', 'F', 'OUTRO']).notNullable();
        table.decimal('renda_mensal', 12, 2).notNullable();
        table.string('email');
        table.string('telefone');
        table.string('endereco');
        table.string('cidade');
        table.string('estado');
        table.string('cep');
        table.string('cpf').unique();
        table.timestamps(true, true);
      })
      
      // Tabela de bureau de crédito
      .createTable('bureau_credito', function(table) {
        table.increments('id').primary();
        table.string('cliente_id').notNullable().references('id').inTable('clientes').onDelete('CASCADE');
        table.integer('score').notNullable();
        table.timestamp('ultima_consulta').defaultTo(knex.fn.now());
        table.enum('status', ['REGULAR', 'IRREGULAR', 'PENDENTE', 'BLOQUEADO']).notNullable();
        table.integer('total_dividas').defaultTo(0);
        table.decimal('valor_dividas', 12, 2).defaultTo(0);
        table.integer('consultas_recentes').defaultTo(0);
        table.timestamps(true, true);
        
        table.unique(['cliente_id']);
      })
      
      // Tabela de dados bancários (Open Banking)
      .createTable('dados_bancarios', function(table) {
        table.increments('id').primary();
        table.string('cliente_id').notNullable().references('id').inTable('clientes').onDelete('CASCADE');
        table.boolean('possui_conta').defaultTo(false);
        table.decimal('saldo_medio', 12, 2).defaultTo(0);
        table.timestamp('ultima_movimentacao');
        table.enum('status', ['ATIVO', 'INATIVO', 'BLOQUEADO', 'ERRO']).notNullable();
        table.integer('tempo_relacionamento_meses').defaultTo(0);
        table.integer('quantidade_produtos').defaultTo(0);
        table.timestamps(true, true);
        
        table.unique(['cliente_id']);
      })
      
      // Tabela de cenários
      .createTable('cenarios', function(table) {
        table.string('id').primary();
        table.string('cliente_id').notNullable().references('id').inTable('clientes');
        table.decimal('valor_credito', 12, 2).notNullable();
        table.timestamp('data_criacao').defaultTo(knex.fn.now());
        table.enum('status', ['APROVADO', 'REPROVADO', 'ANALISE_MANUAL']).notNullable();
        table.boolean('regra_falhou').defaultTo(false);
        table.boolean('precisa_analise_manual').defaultTo(false);
        table.jsonb('parametros_adicionais').defaultTo('{}');
        table.timestamps(true, true);
      })
      
      // Tabela de resultados de avaliação
      .createTable('resultados_avaliacao', function(table) {
        table.increments('id').primary();
        table.string('cenario_id').notNullable().references('id').inTable('cenarios').onDelete('CASCADE');
        table.string('regra').notNullable();
        table.boolean('resultado').notNullable();
        table.string('descricao');
        table.timestamp('data_avaliacao').defaultTo(knex.fn.now());
        table.timestamps(true, true);
      })
      
      // Tabela de resultados IA
      .createTable('resultados_ia', function(table) {
        table.increments('id').primary();
        table.string('cenario_id').notNullable().references('id').inTable('cenarios').onDelete('CASCADE');
        table.boolean('aprovado').notNullable();
        table.string('justificativa');
        table.decimal('confianca', 5, 4);
        table.timestamps(true, true);
        
        table.unique(['cenario_id']);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('resultados_ia')
      .dropTableIfExists('resultados_avaliacao')
      .dropTableIfExists('cenarios')
      .dropTableIfExists('dados_bancarios')
      .dropTableIfExists('bureau_credito')
      .dropTableIfExists('clientes');
  };